// Validation of a task at the edge of the API, before anything reaches the file. The rules for the
// title, the due date and the priority are the domain's own validateTask, so the server and the web app
// agree, and its error keys ("required", "too-long", "unknown", "bad-date") are the ones the client
// already translates. The edge adds what a form never sends: wrong types, unknown fields and a due date
// of the right form that names no day. It collects every error, and on success hands on a new, cleaned
// value — never the raw body. Fields are copied by name from the allowlist, so a key such as "__proto__"
// or "constructor" never travels on.
import { validateTask } from "../../domain/tasks.ts";
import type { Priority } from "../../domain/tasks.ts";
import { isRealDate } from "./config.ts";

export type TaskInput = { title: string; dueDate: string | null; done: boolean; priority: Priority };

export type InputResult = { ok: true; value: TaskInput } | { ok: false; errors: Record<string, string> };

const KNOWN_FIELDS = ["title", "dueDate", "done", "priority"];

export function validateTaskInput(input: unknown): InputResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: { body: "not-an-object" } };
  }
  const body = input as Record<string, unknown>;
  // No prototype: a key such as "__proto__" (JSON.parse makes it an own key) is stored as an error like any
  // other unknown field, instead of changing the object's prototype.
  const errors: Record<string, string> = Object.create(null);

  // The domain rules; a title that is not text is checked as an empty one and reported below. A due
  // date or a priority of another type fails the domain's own checks ("bad-date", "unknown").
  const title = typeof body.title === "string" ? body.title : "";
  const check = validateTask({ title: title, dueDate: body.dueDate as string | null | undefined, priority: body.priority as string | undefined });
  if (!check.ok) {
    Object.assign(errors, check.errors);
  }
  // The domain checks the form "YYYY-MM-DD" only; the edge also refuses a day that does not exist
  // (2026-02-31), with the same key.
  if (typeof body.dueDate === "string" && !isRealDate(body.dueDate)) {
    errors.dueDate = "bad-date";
  }
  if (body.title !== undefined && typeof body.title !== "string") {
    errors.title = "not-a-string";
  }

  if (body.done !== undefined && typeof body.done !== "boolean") {
    errors.done = "not-a-boolean";
  }

  for (const key of Object.keys(body)) {
    if (!KNOWN_FIELDS.includes(key)) {
      errors[key] = "unknown-field";
    }
  }

  if (Object.keys(errors).length > 0 || !check.ok) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { title: check.value.title, dueDate: check.value.dueDate, done: body.done === true, priority: check.value.priority } };
}
