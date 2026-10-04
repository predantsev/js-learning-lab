// The delayed fixture API of the expense tracker: it plays a server. Since the step that connected the real
// server (data/httpApi.ts) it serves the tests and a run without the server (DATA_SOURCE=fixtures, see
// data/api.ts). Every call answers after `settings.delayMs` milliseconds, can be told to fail
// (`settings.failNextRead`, `settings.failNextWrite`) and stops at once when its AbortSignal aborts (the
// promise rejects with an AbortError). The "server" keeps the expenses in a storage — localStorage on the
// page, a memory stand-in in the tests — and every write is an action of expensesReducer, which checks it
// with the domain functions, as a real server would. Nothing here knows about React.
import { filterExpenses } from "../domain/expenses.ts";
import type { Expense, CategoryId } from "../domain/expenses.ts";
import { isUsableExpense, loadExpenses, saveExpenses } from "../storage/expenses.ts";
import type { TextStore } from "../storage/expenses.ts";
import { loadFixtures } from "./fixtures.js";
import { makeSyntheticExpenses } from "./synthetic.js";
import { expensesReducer } from "../ui/expensesReducer.ts";
import { ApiError } from "./apiError.ts";
import type { ExpensesAction, ExpenseFields } from "../ui/expensesReducer.ts";

export type ListFilter = "all" | CategoryId;

export const settings: { delayMs: number; failNextRead: number; failNextWrite: number; nextListAnswer: unknown } = { delayMs: 300, failNextRead: 0, failNextWrite: 0, nextListAnswer: undefined };

// Every list request and how it ended — "answered", "failed" or "aborted" — for the tests.
export const requests: { what: string; outcome: string }[] = [];

let store: TextStore = localStorage;
// The expenses of the "server" once known; null until the first call reads them.
let records: Expense[] | null = null;

// Measuring: with ?synthetic=N in the address (before the #) the "server" answers with N generated
// expenses, kept only in memory, so the saved expenses are never read or overwritten.
const count = Number(new URLSearchParams(location.search).get("synthetic") ?? "0");
if (Number.isInteger(count) && count > 0) {
  const data = new Map<string, string>();
  store = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) };
  // The generated records are plain JavaScript objects: the type predicate of storage/ checks each one
  // and tells tsc that what is left are real records.
  records = makeSyntheticExpenses(count).filter(isUsableExpense);
}

// For the tests: a fresh server with these expenses in a memory storage and quick answers.
export function resetApi(list: Expense[], options: { delayMs?: number } = {}) {
  const data = new Map<string, string>();
  store = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) };
  records = [...list];
  saveExpenses(store, records);
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

// The saved expenses; without usable saved ones, the starting expenses of data/expenses.json.
async function current(signal?: AbortSignal): Promise<Expense[]> {
  if (records !== null) {
    return records;
  }
  const saved = loadExpenses(store);
  const list: Expense[] = saved.ok ? saved.expenses : await loadFixtures(signal);
  records = list;
  saveExpenses(store, list);
  return list;
}

async function read(what: string, signal?: AbortSignal): Promise<Expense[]> {
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
async function write(action: ExpensesAction): Promise<void> {
  await delay();
  if (settings.failNextWrite > 0) {
    settings.failNextWrite -= 1;
    throw new ApiError(503, "The server could not save");
  }
  const list = await current();
  if ("id" in action && !list.some((item) => item.id === action.id)) {
    throw new ApiError(404, "No expense " + action.id);
  }
  const next = expensesReducer(list, action);
  if (next === list) {
    throw new ApiError(400, "The change was refused");
  }
  records = next;
  saveExpenses(store, next);
}

// Query: the expenses of one filter. The answer is `unknown`, like JSON from a network: a copy made
// through JSON.stringify and JSON.parse, which the client must check (data/model.ts). For the tests,
// `settings.nextListAnswer` replaces the next answer once.
export async function listExpenses(filter: ListFilter, signal?: AbortSignal): Promise<unknown> {
  const list = await read("list " + filter, signal);
  if (settings.nextListAnswer !== undefined) {
    const answer = settings.nextListAnswer;
    settings.nextListAnswer = undefined;
    return answer;
  }
  return JSON.parse(JSON.stringify(filter === "all" ? [...list] : filterExpenses(list, filter)));
}

// Mutations: each resolves when the change is saved and rejects with an ApiError otherwise.
export function createExpense(fields: ExpenseFields): Promise<void> {
  return write({ type: "added", fields: fields });
}

export function saveExpense(id: string, fields: ExpenseFields): Promise<void> {
  return write({ type: "updated", id: id, fields: fields });
}

export function deleteExpense(id: string): Promise<void> {
  return write({ type: "removed", id: id });
}
