import { getJson } from "./fixtureServer";
import { parseList } from "./parsing";
import type { ParseResult } from "./parsing";
import { parseTask } from "./taskModel";
import type { ApiTask, Task } from "./taskModel";

export async function loadTasks(): Promise<ParseResult<Task[]>> {
  return parseList(await getJson("list"), parseTask);
}

export async function loadTask(): Promise<ParseResult<Task>> {
  const api = (await getJson("detail")) as ApiTask;
  return { ok: true, value: { id: api.id, title: api.title, dueDate: api.due_date, done: api.is_done, priority: api.priority } };
}
