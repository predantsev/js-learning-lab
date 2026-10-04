// The /v1 records API of the planner — a versioned contract next to the unversioned GET /records of the
// previous step, which stays as it was published:
//   GET    /v1/records          200 { items, nextCursor }  (?done=, ?dueBefore=, ?sort=dueDate|title|priority, ?limit=, ?cursor=)
//   POST   /v1/records          201 + the new task          (Idempotency-Key)
//   GET    /v1/records/:id      200 + the task
//   PUT    /v1/records/:id      200 + the replaced task
//   PATCH  /v1/records/:id      200 + the changed task      (the merged task is validated)
//   DELETE /v1/records/:id      204, no body
// Every failure goes through toErrorResponse; every answer has an x-request-id header. A breaking change
// of this contract would go to /v2, next to /v1.
import type http from "node:http";
import { ApiError, toErrorResponse } from "./api-errors.ts";
import { parseJson, readBodyText } from "./body.ts";
import type { TaskRepository } from "./fileRepository.ts";
import type { Answer, IdempotencyStore } from "./idempotency.ts";
import { listTasks } from "./list.ts";
import { errorLine } from "./log.ts";
import type { Log } from "./log.ts";
import { validateTaskInput } from "./validate.ts";
import type { TaskInput } from "./validate.ts";
import type { Task } from "../../domain/tasks.ts";

export const API_MAX_BODY_BYTES = 4096;

// The next free id: one more than the biggest number among the ids "t-NN", with at least two digits.
function nextId(tasks: Task[]): string {
  let biggest = 0;
  for (const task of tasks) {
    const number = Number(task.id.slice(2));
    if (task.id.startsWith("t-") && Number.isInteger(number) && number > biggest) {
      biggest = number;
    }
  }
  return "t-" + String(biggest + 1).padStart(2, "0");
}

function validated(body: unknown): TaskInput {
  const result = validateTaskInput(body);
  if (!result.ok) {
    throw new ApiError(400, "VALIDATION_FAILED", result.errors);
  }
  return result.value;
}

// What handleV1 needs from the server: the parsed address, the request id, the store, the limits and the log.
export type V1Context = {
  url: URL;
  requestId: string;
  repository: TaskRepository;
  idempotency: IdempotencyStore;
  maxBodyBytes: number;
  log: Log;
  sendJson: (res: http.ServerResponse, status: number, value: unknown) => void;
};

// The shape of a task id; anything else in the path (../, an escaped /, a stray character) is a 400
// before the store is read.
const ID_PATTERN = /^t-\d{2,}$/;

async function collection(req: http.IncomingMessage, { url, repository, idempotency, maxBodyBytes }: V1Context): Promise<Answer> {
  const query = url.searchParams;
  if (req.method === "GET") {
    const result = listTasks(await repository.list(), query);
    if (!result.ok) {
      throw new ApiError(400, "VALIDATION_FAILED", result.errors);
    }
    return { status: 200, body: { items: result.items, nextCursor: result.nextCursor } };
  }
  if (req.method === "POST") {
    // The body limit comes before anything else; Node gives header names in lower case.
    const text = await readBodyText(req, maxBodyBytes);
    const key = req.headers["idempotency-key"];
    return idempotency.run(typeof key === "string" ? key : undefined, text, async () => {
      const value = validated(parseJson(text));
      // The id is chosen and the task saved in one turn of the write queue: two creates never share an id.
      const task = await repository.create((records) => ({ id: nextId(records), ...value }));
      return { status: 201, body: task };
    });
  }
  throw new ApiError(405, "METHOD_NOT_ALLOWED", { method: req.method }, { allow: "GET, POST" });
}

async function oneRecord(req: http.IncomingMessage, id: string, { repository, maxBodyBytes }: V1Context): Promise<Answer> {
  const methods = ["GET", "PUT", "PATCH", "DELETE"];
  if (!methods.includes(req.method ?? "")) {
    throw new ApiError(405, "METHOD_NOT_ALLOWED", { method: req.method }, { allow: methods.join(", ") });
  }
  const text = req.method === "PUT" || req.method === "PATCH" ? await readBodyText(req, maxBodyBytes) : "";
  const current = await repository.get(id);
  if (current === null) {
    throw new ApiError(404, "NOT_FOUND", { id: id });
  }
  if (req.method === "GET") {
    return { status: 200, body: current };
  }
  if (req.method === "DELETE") {
    await repository.remove(id);
    return { status: 204, body: undefined };
  }
  // PUT replaces the whole task; PATCH merges the sent fields into it and validates the result, so a
  // patch can never leave a task that a create would refuse. The id comes from the path only. The merge
  // runs in the write queue on the newest stored task, so two patches of different fields both stay.
  const sent = parseJson(text);
  const task = await repository.update(id, (stored) => {
    const { id: _storedId, ...fields } = stored;
    const input = req.method === "PUT" ? sent : { ...fields, ...(sent as object) };
    return { id: id, ...validated(input) };
  });
  if (task === null) {
    throw new ApiError(404, "NOT_FOUND", { id: id }); // deleted in the meantime
  }
  return { status: 200, body: task };
}

async function route(req: http.IncomingMessage, context: V1Context): Promise<Answer> {
  const { url } = context;
  const parts = url.pathname.split("/").filter((part) => part !== "");
  if (parts[0] === "v1" && parts[1] === "records") {
    if (parts.length === 2) {
      return collection(req, context);
    }
    if (parts.length === 3) {
      let id: string;
      try {
        id = decodeURIComponent(parts[2]);
      } catch {
        throw new ApiError(400, "VALIDATION_FAILED", { id: "malformed" }); // a broken escape such as %E0
      }
      if (!ID_PATTERN.test(id)) {
        throw new ApiError(400, "VALIDATION_FAILED", { id: "malformed" });
      }
      return oneRecord(req, id, context);
    }
  }
  throw new ApiError(404, "NOT_FOUND", { path: url.pathname });
}

// Answers one request under /v1: the route's answer, or the error model for whatever it threw. The server
// has already set x-request-id; the same id goes into every error body.
export async function handleV1(req: http.IncomingMessage, res: http.ServerResponse, context: V1Context): Promise<void> {
  const { requestId, log, sendJson } = context;
  try {
    const answer = await route(req, context);
    if (answer.body === undefined) {
      res.statusCode = answer.status;
      res.end();
    } else {
      sendJson(res, answer.status, answer.body);
    }
  } catch (error) {
    const { status, headers, body } = toErrorResponse(error, requestId);
    if (status >= 500) {
      log(errorLine(requestId, error));
    }
    for (const [name, value] of Object.entries(headers)) {
      res.setHeader(name, value);
    }
    sendJson(res, status, body);
  }
}
