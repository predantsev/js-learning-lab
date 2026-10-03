import { getJson } from "./fixtureServer";
import { parseList } from "./parsing";
import type { ParseResult } from "./parsing";
import { parseTask } from "./taskModel";
import type { ApiTask, Task } from "./taskModel";

// Every answer of the API passes through this file.
// TODO: replace both casts with a parse, so that no unchecked data reaches the screen.

export async function loadTasks(): Promise<ParseResult<Task[]>> {
  const body = await getJson("list");
  const tasks = (body as ApiTask[]).map((api) => ({ id: api.id, title: api.title, dueDate: api.due_date, done: api.is_done, priority: api.priority }));
  return { ok: true, value: tasks };
}

export async function loadTask(): Promise<ParseResult<Task>> {
  const body = await getJson("detail");
  const api = body as ApiTask;
  return { ok: true, value: { id: api.id, title: api.title, dueDate: api.due_date, done: api.is_done, priority: api.priority } };
}
