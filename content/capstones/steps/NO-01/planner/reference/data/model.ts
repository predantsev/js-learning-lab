// The runtime schema of a task at the API boundary. The API answers with `unknown` (as JSON from a
// network would be); parseTaskList checks every field before the app treats the answer as Task[].
// Types alone cannot do this: tsc checks the code, not the data that arrives while it runs.
import { isCalendarDate, isPriority } from "../domain/tasks.ts";
import type { Task } from "../domain/tasks.ts";

// Either the checked value, or an error code for every field that failed ("1.priority": "unknown").
export type ParseResult<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// title 1–80 characters, dueDate "YYYY-MM-DD" or null, done a boolean, priority low|normal|high.
export function parseTask(input: unknown): ParseResult<Task> {
  if (!isObject(input)) {
    return { ok: false, errors: { record: "notObject" } };
  }
  const { id, title, dueDate, done, priority } = input;
  const errors: Record<string, string> = {};
  if (typeof id !== "string" || id === "") {
    errors.id = "required";
  }
  if (typeof title !== "string" || title.trim() === "" || title.trim().length > 80) {
    errors.title = "length1to80";
  }
  if (dueDate !== null && !isCalendarDate(dueDate)) {
    errors.dueDate = "notCalendarDate";
  }
  if (typeof done !== "boolean") {
    errors.done = "notBoolean";
  }
  if (!isPriority(priority)) {
    errors.priority = "unknown";
  }
  if (typeof id !== "string" || typeof title !== "string" || (dueDate !== null && !isCalendarDate(dueDate)) || typeof done !== "boolean" || !isPriority(priority) || Object.keys(errors).length > 0) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { id: id, title: title.trim(), dueDate: dueDate, done: done, priority: priority } };
}

// An array of tasks with different ids; the errors name the position: "2.priority".
export function parseTaskList(input: unknown): ParseResult<Task[]> {
  if (!Array.isArray(input)) {
    return { ok: false, errors: { list: "notArray" } };
  }
  const tasks: Task[] = [];
  const errors: Record<string, string> = {};
  input.forEach((record: unknown, index) => {
    const parsed = parseTask(record);
    if (parsed.ok) {
      tasks.push(parsed.value);
    } else {
      for (const [field, code] of Object.entries(parsed.errors)) {
        errors[index + 1 + "." + field] = code;
      }
    }
  });
  if (new Set(tasks.map((task) => task.id)).size !== tasks.length) {
    errors.id = "duplicate";
  }
  return Object.keys(errors).length === 0 ? { ok: true, value: tasks } : { ok: false, errors: errors };
}
