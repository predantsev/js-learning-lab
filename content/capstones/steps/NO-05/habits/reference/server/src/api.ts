// The /v1 records API of the habit tracker — a versioned contract next to the unversioned GET /records of the
// previous step, which stays as it was published:
//   GET    /v1/records          200 { items, nextCursor }  (?active=, ?sort=name, ?limit=, ?cursor=)
//   POST   /v1/records          201 + the new habit          (Idempotency-Key)
//   GET    /v1/records/:id      200 + the habit
//   PUT    /v1/records/:id      200 + the replaced habit
//   PATCH  /v1/records/:id      200 + the changed habit      (the merged habit is validated)
//   DELETE /v1/records/:id      204, no body
//   POST   /v1/records/:id/completions  200 + the habit  ({ "day": "YYYY-MM-DD" }; a retry adds nothing)
// Every failure goes through toErrorResponse; every answer has an x-request-id header. A breaking change
// of this contract would go to /v2, next to /v1.
import { randomUUID } from "node:crypto";
import type http from "node:http";
import { ApiError, toErrorResponse } from "./api-errors.ts";
import { parseJson, readBodyText } from "./body.ts";
import type { HabitRepository } from "./fileRepository.ts";
import type { Answer, IdempotencyStore } from "./idempotency.ts";
import { listHabits } from "./list.ts";
import { validateHabitInput } from "./validate.ts";
import type { HabitInput } from "./validate.ts";
import { completeHabit, isCalendarDate } from "../../domain/habits.ts";
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

async function collection(req: http.IncomingMessage, query: URLSearchParams, repository: HabitRepository, idempotency: IdempotencyStore): Promise<Answer> {
  if (req.method === "GET") {
    const result = listHabits(await repository.list(), query);
    if (!result.ok) {
      throw new ApiError(400, "VALIDATION_FAILED", result.errors);
    }
    return { status: 200, body: { items: result.items, nextCursor: result.nextCursor } };
  }
  if (req.method === "POST") {
    // The body limit comes before anything else; Node gives header names in lower case.
    const text = await readBodyText(req, API_MAX_BODY_BYTES);
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

async function oneRecord(req: http.IncomingMessage, id: string, repository: HabitRepository): Promise<Answer> {
  const methods = ["GET", "PUT", "PATCH", "DELETE"];
  if (!methods.includes(req.method ?? "")) {
    throw new ApiError(405, "METHOD_NOT_ALLOWED", { method: req.method }, { allow: methods.join(", ") });
  }
  const text = req.method === "PUT" || req.method === "PATCH" ? await readBodyText(req, API_MAX_BODY_BYTES) : "";
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
// and sorted, so a retried request leaves a single entry and needs no Idempotency-Key.
async function completions(req: http.IncomingMessage, id: string, repository: HabitRepository): Promise<Answer> {
  if (req.method !== "POST") {
    throw new ApiError(405, "METHOD_NOT_ALLOWED", { method: req.method }, { allow: "POST" });
  }
  const body = parseJson(await readBodyText(req, API_MAX_BODY_BYTES));
  const day = typeof body === "object" && body !== null ? (body as Record<string, unknown>).day : undefined;
  const errors: Record<string, string> = {};
  if (!isCalendarDate(day)) {
    errors.day = "bad-date";
  }
  for (const key of typeof body === "object" && body !== null && !Array.isArray(body) ? Object.keys(body) : ["body"]) {
    if (key !== "day") {
      errors[key] = key === "body" ? "not-an-object" : "unknown-field";
    }
  }
  if (Object.keys(errors).length > 0 || !isCalendarDate(day)) {
    throw new ApiError(400, "VALIDATION_FAILED", errors);
  }
  // The day is added in the write queue to the newest stored habit, so two days sent at the same moment
  // both stay.
  const changed = await repository.update(id, (stored) => completeHabit([stored], id, day)[0]);
  if (changed === null) {
    throw new ApiError(404, "NOT_FOUND", { id: id });
  }
  return { status: 200, body: changed };
}

async function route(req: http.IncomingMessage, url: URL, repository: HabitRepository, idempotency: IdempotencyStore): Promise<Answer> {
  const parts = url.pathname.split("/").filter((part) => part !== "");
  if (parts[0] === "v1" && parts[1] === "records") {
    if (parts.length === 2) {
      return collection(req, url.searchParams, repository, idempotency);
    }
    if (parts.length === 3) {
      let id: string;
      try {
        id = decodeURIComponent(parts[2]);
      } catch {
        throw new ApiError(400, "VALIDATION_FAILED", { id: "malformed" }); // a broken escape such as %E0
      }
      return oneRecord(req, id, repository);
    }
    if (parts.length === 4 && parts[3] === "completions") {
      let id: string;
      try {
        id = decodeURIComponent(parts[2]);
      } catch {
        throw new ApiError(400, "VALIDATION_FAILED", { id: "malformed" });
      }
      return completions(req, id, repository);
    }
  }
  throw new ApiError(404, "NOT_FOUND", { path: url.pathname });
}

// Answers one request under /v1: the route's answer, or the error model for whatever it threw.
export async function handleV1(req: http.IncomingMessage, res: http.ServerResponse, url: URL, repository: HabitRepository, idempotency: IdempotencyStore, sendJson: (res: http.ServerResponse, status: number, value: unknown) => void): Promise<void> {
  const requestId = randomUUID();
  res.setHeader("x-request-id", requestId);
  try {
    const answer = await route(req, url, repository, idempotency);
    if (answer.body === undefined) {
      res.statusCode = answer.status;
      res.end();
    } else {
      sendJson(res, answer.status, answer.body);
    }
  } catch (error) {
    const { status, headers, body } = toErrorResponse(error, requestId);
    if (status >= 500) {
      console.error(`[${requestId}]`, error);
    }
    for (const [name, value] of Object.entries(headers)) {
      res.setHeader(name, value);
    }
    sendJson(res, status, body);
  }
}
