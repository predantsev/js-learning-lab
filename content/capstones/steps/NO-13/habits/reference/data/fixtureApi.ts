// The delayed fixture API of the habit tracker: it plays a server. Since the step that connected the real
// server (data/httpApi.ts) it serves the tests and a run without the server (DATA_SOURCE=fixtures, see
// data/api.ts). Every call answers after `settings.delayMs` milliseconds, can be told to fail
// (`settings.failNextRead`, `settings.failNextWrite`) and stops at once when its AbortSignal aborts (the
// promise rejects with an AbortError). The "server" keeps the habits in a storage — localStorage on the
// page, a memory stand-in in the tests — and every write is an action of habitsReducer, which checks it
// with the domain functions, as a real server would. Nothing here knows about React.
import { filterHabits } from "../domain/habits.ts";
import type { Habit, HabitStatus } from "../domain/habits.ts";
import { isUsableHabit, loadHabits, saveHabits } from "../storage/habits.ts";
import type { TextStore } from "../storage/habits.ts";
import { loadFixtures } from "./fixtures.js";
import { makeSyntheticHabits } from "./synthetic.js";
import { habitsReducer } from "../ui/habitsReducer.ts";
import { ApiError } from "./apiError.ts";
import type { HabitsAction, HabitFields } from "../ui/habitsReducer.ts";

export type ListFilter = "all" | HabitStatus;

export const settings: { delayMs: number; failNextRead: number; failNextWrite: number; nextListAnswer: unknown } = { delayMs: 300, failNextRead: 0, failNextWrite: 0, nextListAnswer: undefined };

// Every list request and how it ended — "answered", "failed" or "aborted" — for the tests.
export const requests: { what: string; outcome: string }[] = [];

let store: TextStore = localStorage;
// The habits of the "server" once known; null until the first call reads them.
let records: Habit[] | null = null;

// Measuring: with ?synthetic=N in the address (before the #) the "server" answers with N generated
// habits, kept only in memory, so the saved habits are never read or overwritten.
const count = Number(new URLSearchParams(location.search).get("synthetic") ?? "0");
if (Number.isInteger(count) && count > 0) {
  const data = new Map<string, string>();
  store = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) };
  // The generated records are plain JavaScript objects: the type predicate of storage/ checks each one
  // and tells tsc that what is left are real records.
  records = makeSyntheticHabits(count, 365).filter(isUsableHabit);
}

// For the tests: a fresh server with these habits in a memory storage and quick answers.
export function resetApi(list: Habit[], options: { delayMs?: number } = {}) {
  const data = new Map<string, string>();
  store = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) };
  records = [...list];
  saveHabits(store, records);
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

// The saved habits; without usable saved ones, the starting habits of data/habits.json.
async function current(signal?: AbortSignal): Promise<Habit[]> {
  if (records !== null) {
    return records;
  }
  const saved = loadHabits(store);
  const list: Habit[] = saved.ok ? saved.habits : await loadFixtures(signal);
  records = list;
  saveHabits(store, list);
  return list;
}

async function read(what: string, signal?: AbortSignal): Promise<Habit[]> {
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
async function write(action: HabitsAction): Promise<void> {
  await delay();
  if (settings.failNextWrite > 0) {
    settings.failNextWrite -= 1;
    throw new ApiError(503, "The server could not save");
  }
  const list = await current();
  if ("id" in action && !list.some((item) => item.id === action.id)) {
    throw new ApiError(404, "No habit " + action.id);
  }
  const next = habitsReducer(list, action);
  if (next === list) {
    throw new ApiError(400, "The change was refused");
  }
  records = next;
  saveHabits(store, next);
}

// Query: the habits of one filter. The answer is `unknown`, like JSON from a network: a copy made
// through JSON.stringify and JSON.parse, which the client must check (data/model.ts). For the tests,
// `settings.nextListAnswer` replaces the next answer once.
export async function listHabits(filter: ListFilter, signal?: AbortSignal): Promise<unknown> {
  const list = await read("list " + filter, signal);
  if (settings.nextListAnswer !== undefined) {
    const answer = settings.nextListAnswer;
    settings.nextListAnswer = undefined;
    return answer;
  }
  return JSON.parse(JSON.stringify(filter === "all" ? [...list] : filterHabits(list, filter)));
}

// Mutations: each resolves when the change is saved and rejects with an ApiError otherwise.
export function createHabit(fields: HabitFields): Promise<void> {
  return write({ type: "added", fields: fields });
}

export function saveHabit(id: string, fields: HabitFields): Promise<void> {
  return write({ type: "updated", id: id, fields: fields });
}

export function deleteHabit(id: string): Promise<void> {
  return write({ type: "removed", id: id });
}

// The day is added once; a day the habit already has is refused (400).
export function addCompletion(id: string, day: string): Promise<void> {
  return write({ type: "completionAdded", id: id, day: day });
}
