import { isObject } from "./parsing";
import type { ParseResult } from "./parsing";

export type ApiTask = {
  id: string;
  title: string;
  due_date: string | null;
  is_done: boolean;
  priority: "low" | "normal" | "high";
};

export type Task = {
  readonly id: string;
  title: string;
  dueDate: string | null;
  done: boolean;
  priority: "low" | "normal" | "high";
};

function isPriority(value: unknown): value is Task["priority"] {
  switch (value) {
    case "low":
    case "normal":
    case "high":
      return true;
    default:
      return false;
  }
}

function isCalendarDate(value: unknown): value is string {
  return typeof value === "string" && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value);
}

export function parseTask(input: unknown): ParseResult<Task> {
  if (!isObject(input)) return { ok: false, errors: { record: "notObject" } };
  const errors: Record<string, string> = {};
  const id = typeof input.id === "string" ? input.id : "";
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (id.length === 0) errors.id = "required";
  if (title.length === 0) errors.title = "required";
  if (!(input.due_date === null || isCalendarDate(input.due_date))) errors.dueDate = "invalidDate";
  if (input.is_done !== true && input.is_done !== false) errors.done = "notBoolean";
  if (!isPriority(input.priority)) errors.priority = "unknownPriority";
  if (Object.keys(errors).length > 0 || !isPriority(input.priority) || typeof input.is_done !== "boolean") {
    return { ok: false, errors };
  }
  const dueDate = input.due_date === null ? null : String(input.due_date);
  return { ok: true, value: { id, title, dueDate, done: input.is_done, priority: input.priority } };
}
