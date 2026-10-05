// The /v1 records API of the habit tracker — a versioned contract next to the unversioned GET /records of the
// previous step, which stays as it was published:
//   GET    /v1/records          200 { items, nextCursor }  (?active=, ?sort=name, ?limit=, ?cursor=)
//   POST   /v1/records          201 + the new habit          (Idempotency-Key)
//   GET    /v1/records/:id      200 + the habit
//   PUT    /v1/records/:id      200 + the replaced habit
//   PATCH  /v1/records/:id      200 + the changed habit      (the merged habit is validated)
//   DELETE /v1/records/:id      204, no body
//   POST   /v1/records/:id/completions  200 + the habit  ({ "day": "YYYY-MM-DD" }; a retry adds nothing)
//   GET    /v1/export           200, every habit as one JSON line (application/x-ndjson), streamed
//   POST   /v1/import           200 { lines, created, updated } — JSON lines in, upsert by id (importer.ts)
// Every failure goes through toErrorResponse; every answer has an x-request-id header. A breaking change
// of this contract would go to /v2, next to /v1.
import type http from "node:http";
import { PassThrough, Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ApiError, toErrorResponse } from "./api-errors.ts";
import { parseJson, readBodyText } from "./body.ts";
import type { HabitRepository } from "./fileRepository.ts";
import type { Answer, IdempotencyStore } from "./idempotency.ts";
import { IMPORT_LIMITS, importJsonLines } from "./importer.ts";
import type { ImportLimits } from "./importer.ts";
import { QueueFull } from "./jobs.ts";
import type { JobQueue } from "./jobs.ts";
import { toJsonLines } from "./jsonl.ts";
import { listHabits } from "./list.ts";
import { errorLine } from "./log.ts";
import type { Log } from "./log.ts";
import { isRealDay, MAX_COMPLETIONS, validateHabitInput } from "./validate.ts";
import type { HabitInput } from "./validate.ts";
import { completeHabit } from "../../domain/habits.ts";
import type { Habit } from "../../domain/habits.ts";

export const API_MAX_BODY_BYTES = 4096;

// The next free id: one more than the biggest number among the ids "h-NN", with at least two digits.
function nextId(habits: Habit[]): string {
  let biggest = 0;
  for (const habit of habits) {
    const number = Number(habit.id.slice(2));
    if (habit.id.startsWith("h-") && Number.isInteger(number) && number > biggest) {
      biggest = number;
    }
  }
  return "h-" + String(biggest + 1).padStart(2, "0");
}

function validated(body: unknown): HabitInput {
  const result = validateHabitInput(body);
  if (!result.ok) {
    throw new ApiError(400, "VALIDATION_FAILED", result.errors);
  }
  return result.value;
}

// What handleV1 needs from the server: the parsed address, the request id, the store, the limits and the log.
export type V1Context = {
  url: URL;
  requestId: string;
  repository: HabitRepository;
  idempotency: IdempotencyStore;
  maxBodyBytes: number;
  log: Log;
  imports: JobQueue; // the import jobs of this server: one at a time, none waiting
  importLimits?: Partial<ImportLimits>;
  sendJson: (res: http.ServerResponse, status: number, value: unknown) => void;
};

// The shape of a habit id; anything else in the path (../, an escaped /, a stray character) is a 400
// before the store is read.
export const ID_PATTERN = /^h-\d{2,}$/;

// GET /v1/export: the stored habits as JSON lines, streamed. pipeline() writes as fast as the client reads
// (backpressure) and closes both sides when either fails or the client goes away.
async function exportRoute(req: http.IncomingMessage, res: http.ServerResponse, { repository }: V1Context): Promise<Answer> {
  if (req.method !== "GET") {
    throw new ApiError(405, "METHOD_NOT_ALLOWED", { method: req.method }, { allow: "GET" });
  }
  const habits = await repository.list();
  res.statusCode = 200;
  res.setHeader("content-type", "application/x-ndjson; charset=utf-8");
  await pipeline(Readable.from(toJsonLines(habits)), res);
  return { status: 200, body: undefined };
}

// Reads and drops the rest of a request body, at most maxBytes more; a bigger rest destroys the connection.
// A server that closes while the client is still sending makes the system reset the connection, and the
// client can lose the answer that was already on its way; after the rest is read, the 413 arrives whole.
async function dropRest(req: http.IncomingMessage, maxBytes: number): Promise<void> {
  let dropped = 0;
  const onData = (chunk: Buffer) => {
    dropped += chunk.length;
    if (dropped > maxBytes) {
      req.destroy();
    }
  };
  req.on("data", onData);
  req.resume();
  await new Promise<void>((resolve) => {
    req.once("end", () => resolve());
    req.once("close", () => resolve());
  });
  req.off("data", onData);
}

// POST /v1/import: the body is JSON lines. The job runs in the server's import queue; when it is busy the
// answer is 503 with Retry-After at once. The body goes through a PassThrough, so a refusal in the middle
// (a limit) destroys only that copy: the rest of the body is dropped and the server still answers 413. A
// client that goes away aborts the job through its signal, and nothing reaches the store.
async function importRoute(req: http.IncomingMessage, res: http.ServerResponse, { repository, imports, importLimits }: V1Context): Promise<Answer> {
  if (req.method !== "POST") {
    throw new ApiError(405, "METHOD_NOT_ALLOWED", { method: req.method }, { allow: "POST" });
  }
  const controller = new AbortController();
  const limits = { ...IMPORT_LIMITS, ...importLimits };
  const onClose = () => {
    if (!res.writableFinished) {
      controller.abort();
    }
  };
  res.on("close", onClose);
  try {
    const result = await imports.add(async () => {
      const body = new PassThrough();
      req.pipe(body);
      try {
        return await importJsonLines(body, repository, { idPattern: ID_PATTERN, signal: controller.signal, limits: limits });
      } catch (error) {
        if (error instanceof ApiError && error.status === 413 && !controller.signal.aborted) {
          req.unpipe(body);
          await dropRest(req, limits.maxBytes);
        }
        throw error;
      }
    });
    return { status: 200, body: result };
  } catch (error) {
    if (error instanceof QueueFull) {
      throw new ApiError(503, "IMPORT_BUSY", {}, { "retry-after": "1", connection: "close" });
    }
    throw error;
  } finally {
    res.off("close", onClose);
  }
}

async function collection(req: http.IncomingMessage, { url, repository, idempotency, maxBodyBytes }: V1Context): Promise<Answer> {
  const query = url.searchParams;
  if (req.method === "GET") {
    const result = listHabits(await repository.list(), query);
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
      // The id is chosen and the habit saved in one turn of the write queue: two creates never share an id.
      const habit = await repository.create((records) => ({ id: nextId(records), ...value }));
      return { status: 201, body: habit };
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
  // PUT replaces the whole habit; PATCH merges the sent fields into it and validates the result, so a
  // patch can never leave a habit that a create would refuse. The id comes from the path only. The merge
  // runs in the write queue on the newest stored habit, so two patches of different fields both stay.
  const sent = parseJson(text);
  const habit = await repository.update(id, (stored) => {
    const { id: _storedId, ...fields } = stored;
    const input = req.method === "PUT" ? sent : { ...fields, ...(sent as object) };
    return { id: id, ...validated(input) };
  });
  if (habit === null) {
    throw new ApiError(404, "NOT_FOUND", { id: id }); // deleted in the meantime
  }
  return { status: 200, body: habit };
}

// "Done today" adds a day to the completions through completeHabit of the domain: the days stay unique
// and sorted, so a retried request leaves a single entry and needs no Idempotency-Key. The day must exist
// in the calendar, and a new day may not take a habit past MAX_COMPLETIONS.
async function completions(req: http.IncomingMessage, id: string, { repository, maxBodyBytes }: V1Context): Promise<Answer> {
  if (req.method !== "POST") {
    throw new ApiError(405, "METHOD_NOT_ALLOWED", { method: req.method }, { allow: "POST" });
  }
  const body = parseJson(await readBodyText(req, maxBodyBytes));
  const day = typeof body === "object" && body !== null ? (body as Record<string, unknown>).day : undefined;
  // No prototype, as in validate.ts: a "__proto__" key is reported as an unknown field.
  const errors: Record<string, string> = Object.create(null);
  if (!isRealDay(day)) {
    errors.day = "bad-date";
  }
  for (const key of typeof body === "object" && body !== null && !Array.isArray(body) ? Object.keys(body) : ["body"]) {
    if (key !== "day") {
      errors[key] = key === "body" ? "not-an-object" : "unknown-field";
    }
  }
  if (Object.keys(errors).length > 0 || !isRealDay(day)) {
    throw new ApiError(400, "VALIDATION_FAILED", errors);
  }
  // The day is added in the write queue to the newest stored habit, so two days sent at the same moment
  // both stay.
  const changed = await repository.update(id, (stored) => {
    const next = completeHabit([stored], id, day)[0];
    if (next.completions.length > MAX_COMPLETIONS) {
      throw new ApiError(400, "VALIDATION_FAILED", { completions: "too-many" }); // nothing is written
    }
    return next;
  });
  if (changed === null) {
    throw new ApiError(404, "NOT_FOUND", { id: id });
  }
  return { status: 200, body: changed };
}

// The id from the path, decoded and checked against ID_PATTERN, for both /records/:id and
// /records/:id/completions.
function idFrom(part: string): string {
  let id: string;
  try {
    id = decodeURIComponent(part);
  } catch {
    throw new ApiError(400, "VALIDATION_FAILED", { id: "malformed" }); // a broken escape such as %E0
  }
  if (!ID_PATTERN.test(id)) {
    throw new ApiError(400, "VALIDATION_FAILED", { id: "malformed" });
  }
  return id;
}

async function route(req: http.IncomingMessage, res: http.ServerResponse, context: V1Context): Promise<Answer> {
  const { url } = context;
  const parts = url.pathname.split("/").filter((part) => part !== "");
  if (parts[0] === "v1" && parts.length === 2 && parts[1] === "export") {
    return exportRoute(req, res, context);
  }
  if (parts[0] === "v1" && parts.length === 2 && parts[1] === "import") {
    return importRoute(req, res, context);
  }
  if (parts[0] === "v1" && parts[1] === "records") {
    if (parts.length === 2) {
      return collection(req, context);
    }
    if (parts.length === 3) {
      return oneRecord(req, idFrom(parts[2]), context);
    }
    if (parts.length === 4 && parts[3] === "completions") {
      return completions(req, idFrom(parts[2]), context);
    }
  }
  throw new ApiError(404, "NOT_FOUND", { path: url.pathname });
}

// Answers one request under /v1: the route's answer, or the error model for whatever it threw. The server
// has already set x-request-id; the same id goes into every error body.
export async function handleV1(req: http.IncomingMessage, res: http.ServerResponse, context: V1Context): Promise<void> {
  const { requestId, log, sendJson } = context;
  try {
    const answer = await route(req, res, context);
    if (res.writableEnded) {
      return; // streamed already (the export)
    }
    if (answer.body === undefined) {
      res.statusCode = answer.status;
      res.end();
    } else {
      sendJson(res, answer.status, answer.body);
    }
  } catch (error) {
    if (res.headersSent) {
      log(errorLine(requestId, error));
      res.destroy(); // a stream broke in the middle: the client must not take a cut list for a whole one
      return;
    }
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
