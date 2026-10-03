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

// TODO: check `input` field by field and return { ok: true, value: Task } or { ok: false, errors }.
// Error keys and messages:
//   not an object                      → { record: "notObject" }   (and nothing else)
//   id: not a non-empty string         → id: "required"
//   title: not a non-empty string      → title: "required"   (spaces only count as empty; the value is trimmed)
//   due_date: not null and not "YYYY-MM-DD" → dueDate: "invalidDate"
//   is_done: not true/false            → done: "notBoolean"
//   priority: not low | normal | high  → priority: "unknownPriority"
// Report every bad field, not only the first one.
export function parseTask(input: unknown): ParseResult<Task> {
  const api = input as ApiTask;
  return { ok: true, value: { id: api.id, title: api.title, dueDate: api.due_date, done: api.is_done, priority: api.priority } };
}
