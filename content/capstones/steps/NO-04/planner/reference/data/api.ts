// The delayed fixture API of the planner: it plays a server. Every call answers after `settings.delayMs`
// milliseconds, can be told to fail (`settings.failNextRead`, `settings.failNextWrite`) and stops at
// once when its AbortSignal aborts (the promise rejects with an AbortError). The "server" keeps the
// tasks in a storage — localStorage on the page, a memory stand-in in the tests — with the same
// storage functions as before, and every write is an action of tasksReducer, which checks it with the
// domain functions, as a real server would. Nothing here knows about React.
import { filterTasks } from "../domain/tasks.ts";
import type { Task, TaskStatus } from "../domain/tasks.ts";
import { isUsableTask, loadTasks, saveTasks } from "../storage/tasks.ts";
import type { TextStore } from "../storage/tasks.ts";
import { loadFixtures } from "./fixtures.js";
import { makeSyntheticTasks } from "./synthetic.js";
import { tasksReducer } from "../ui/tasksReducer.ts";
import type { TasksAction, TaskFields } from "../ui/tasksReducer.ts";

export type ListFilter = "all" | TaskStatus;

// An answer that is not ok: `status` as in HTTP (400 a refused draft, 404 an unknown id, 503 a failure).
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const settings: { delayMs: number; failNextRead: number; failNextWrite: number; nextListAnswer: unknown } = { delayMs: 300, failNextRead: 0, failNextWrite: 0, nextListAnswer: undefined };

// Every list request and how it ended — "answered", "failed" or "aborted" — for the tests.
export const requests: { what: string; outcome: string }[] = [];

let store: TextStore = localStorage;
// The tasks of the "server" once known; null until the first call reads them.
let records: Task[] | null = null;

// Measuring: with ?synthetic=N in the address (before the #) the "server" answers with N generated
// tasks, kept only in memory, so the saved tasks are never read or overwritten.
const count = Number(new URLSearchParams(location.search).get("synthetic") ?? "0");
if (Number.isInteger(count) && count > 0) {
  const data = new Map<string, string>();
  store = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) };
  // The generated records are plain JavaScript objects: the type predicate of storage/ checks each one
  // and tells tsc that what is left are real records.
  records = makeSyntheticTasks(count).filter(isUsableTask);
}

// For the tests: a fresh server with these tasks in a memory storage and quick answers.
export function resetApi(list: Task[], options: { delayMs?: number } = {}) {
  const data = new Map<string, string>();
  store = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) };
  records = [...list];
  saveTasks(store, records);
  requests.length = 0;
  Object.assign(settings, { delayMs: options.delayMs ?? 20, failNextRead: 0, failNextWrite: 0, nextListAnswer: undefined });
}

// Waits `settings.delayMs`, or rejects with an AbortError as soon as `signal` aborts.
function delay(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("The request was aborted.", "AbortError"));
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("The request was aborted.", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, settings.delayMs);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

// The saved tasks; without usable saved ones, the starting tasks of data/tasks.json.
async function current(signal?: AbortSignal): Promise<Task[]> {
  if (records !== null) {
    return records;
  }
  const saved = loadTasks(store);
  const list: Task[] = saved.ok ? saved.tasks : await loadFixtures(signal);
  records = list;
  saveTasks(store, list);
  return list;
}

async function read(what: string, signal?: AbortSignal): Promise<Task[]> {
  const request = { what: what, outcome: "pending" };
  requests.push(request);
  try {
    await delay(signal);
  } catch (error) {
    request.outcome = "aborted";
    throw error;
  }
  if (settings.failNextRead > 0) {
    settings.failNextRead -= 1;
    request.outcome = "failed";
    throw new ApiError(503, "The server could not answer");
  }
  request.outcome = "answered";
  return current(signal);
}

// Applies one action. An unknown id answers 404; an action the reducer refuses (it returns the same
// list) answers 400 and saves nothing.
async function write(action: TasksAction): Promise<void> {
  await delay();
  if (settings.failNextWrite > 0) {
    settings.failNextWrite -= 1;
    throw new ApiError(503, "The server could not save");
  }
  const list = await current();
  if ("id" in action && !list.some((item) => item.id === action.id)) {
    throw new ApiError(404, "No task " + action.id);
  }
  const next = tasksReducer(list, action);
  if (next === list) {
    throw new ApiError(400, "The change was refused");
  }
  records = next;
  saveTasks(store, next);
}

// Query: the tasks of one filter. The answer is `unknown`, like JSON from a network: a copy made
// through JSON.stringify and JSON.parse, which the client must check (data/model.ts). For the tests,
// `settings.nextListAnswer` replaces the next answer once.
export async function listTasks(filter: ListFilter, signal?: AbortSignal): Promise<unknown> {
  const list = await read("list " + filter, signal);
  if (settings.nextListAnswer !== undefined) {
    const answer = settings.nextListAnswer;
    settings.nextListAnswer = undefined;
    return answer;
  }
  return JSON.parse(JSON.stringify(filter === "all" ? [...list] : filterTasks(list, filter)));
}

// Mutations: each resolves when the change is saved and rejects with an ApiError otherwise.
export function createTask(fields: TaskFields): Promise<void> {
  return write({ type: "added", fields: fields });
}

export function saveTask(id: string, fields: TaskFields): Promise<void> {
  return write({ type: "updated", id: id, fields: fields });
}

export function deleteTask(id: string): Promise<void> {
  return write({ type: "removed", id: id });
}
