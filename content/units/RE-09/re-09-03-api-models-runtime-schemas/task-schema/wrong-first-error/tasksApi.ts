import { getJson } from "./fixtureServer";
import { parseList } from "./parsing";
import type { ParseResult } from "./parsing";
import { parseTask } from "./taskModel";
import type { Task } from "./taskModel";

// Every answer of the API passes through this file, and every answer is parsed here.

export async function loadTasks(): Promise<ParseResult<Task[]>> {
  return parseList(await getJson("list"), parseTask);
}

export async function loadTask(): Promise<ParseResult<Task>> {
  return parseTask(await getJson("detail"));
}
