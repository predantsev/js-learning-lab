import { isObject } from "./parsing";
import type { ParseResult } from "./parsing";

// What the planner API sends.
export type ApiTask = {
  id: string;
  title: string;
  due_date: string | null; // "YYYY-MM-DD"
  is_done: boolean;
  priority: "low" | "normal" | "high";
};

// What the app works with.
export type Task = {
  readonly id: string;
  title: string;
  dueDate: string | null;
  done: boolean;
  priority: "low" | "normal" | "high";
};

const PRIORITIES: readonly string[] = ["low", "normal", "high"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseTask(input: unknown): ParseResult<Task> {
  if (!isObject(input)) return { ok: false, errors: { record: "notObject" } };
  const errors: Record<string, string> = {};
  const { id, title, due_date, is_done, priority } = input;
  if (typeof id !== "string" || id === "") errors.id = "required";
  if (typeof title !== "string" || title.trim() === "") errors.title = "required";
  if (due_date !== null && (typeof due_date !== "string" || !DATE.test(due_date))) errors.dueDate = "invalidDate";
  if (typeof is_done !== "boolean") errors.done = "notBoolean";
  if (typeof priority !== "string" || !PRIORITIES.includes(priority)) errors.priority = "unknownPriority";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const api = input as ApiTask; // every field was checked above
  return { ok: true, value: { id: api.id, title: api.title.trim(), dueDate: api.due_date, done: api.is_done, priority: api.priority } };
}
