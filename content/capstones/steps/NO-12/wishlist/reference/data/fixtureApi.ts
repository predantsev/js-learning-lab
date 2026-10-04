// The delayed fixture API of the wishlist: it plays a server. Since the step that connected the real
// server (data/httpApi.ts) it serves the tests and a run without the server (DATA_SOURCE=fixtures, see
// data/api.ts). Every call answers after `settings.delayMs` milliseconds, can be told to fail
// (`settings.failNextRead`, `settings.failNextWrite`) and stops at once when its AbortSignal aborts (the
// promise rejects with an AbortError). The "server" keeps the wishes in a storage — localStorage on the
// page, a memory stand-in in the tests — and every write is an action of itemsReducer, which checks it
// with the domain functions, as a real server would. Nothing here knows about React.
import { filterItems } from "../domain/wishes.ts";
import type { Wish, WishStatus } from "../domain/wishes.ts";
import { isUsableItem, loadItems, saveItems } from "../storage/wishes.ts";
import type { TextStore } from "../storage/wishes.ts";
import { loadFixtures } from "./fixtures.js";
import { makeSyntheticWishes } from "./synthetic.js";
import { itemsReducer } from "../ui/itemsReducer.ts";
import { ApiError } from "./apiError.ts";
import type { ItemsAction, WishFields } from "../ui/itemsReducer.ts";

export type ListFilter = "all" | WishStatus;

export const settings: { delayMs: number; failNextRead: number; failNextWrite: number; nextListAnswer: unknown } = { delayMs: 300, failNextRead: 0, failNextWrite: 0, nextListAnswer: undefined };

// Every list request and how it ended — "answered", "failed" or "aborted" — for the tests.
export const requests: { what: string; outcome: string }[] = [];

let store: TextStore = localStorage;
// The wishes of the "server" once known; null until the first call reads them.
let records: Wish[] | null = null;

// Measuring: with ?synthetic=N in the address (before the #) the "server" answers with N generated
// wishes, kept only in memory, so the saved wishes are never read or overwritten.
const count = Number(new URLSearchParams(location.search).get("synthetic") ?? "0");
if (Number.isInteger(count) && count > 0) {
  const data = new Map<string, string>();
  store = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) };
  // The generated records are plain JavaScript objects: the type predicate of storage/ checks each one
  // and tells tsc that what is left are real records.
  records = makeSyntheticWishes(count).filter(isUsableItem);
}

// For the tests: a fresh server with these wishes in a memory storage and quick answers.
export function resetApi(list: Wish[], options: { delayMs?: number } = {}) {
  const data = new Map<string, string>();
  store = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) };
  records = [...list];
  saveItems(store, records);
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

// The saved wishes; without usable saved ones, the starting wishes of data/wishes.json.
async function current(signal?: AbortSignal): Promise<Wish[]> {
  if (records !== null) {
    return records;
  }
  const saved = loadItems(store);
  const list: Wish[] = saved.ok ? saved.items : await loadFixtures(signal);
  records = list;
  saveItems(store, list);
  return list;
}

async function read(what: string, signal?: AbortSignal): Promise<Wish[]> {
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
async function write(action: ItemsAction): Promise<void> {
  await delay();
  if (settings.failNextWrite > 0) {
    settings.failNextWrite -= 1;
    throw new ApiError(503, "The server could not save");
  }
  const list = await current();
  if ("id" in action && !list.some((item) => item.id === action.id)) {
    throw new ApiError(404, "No wish " + action.id);
  }
  const next = itemsReducer(list, action);
  if (next === list) {
    throw new ApiError(400, "The change was refused");
  }
  records = next;
  saveItems(store, next);
}

// Query: the wishes of one filter. The answer is `unknown`, like JSON from a network: a copy made
// through JSON.stringify and JSON.parse, which the client must check (data/model.ts). For the tests,
// `settings.nextListAnswer` replaces the next answer once.
export async function listItems(filter: ListFilter, signal?: AbortSignal): Promise<unknown> {
  const list = await read("list " + filter, signal);
  if (settings.nextListAnswer !== undefined) {
    const answer = settings.nextListAnswer;
    settings.nextListAnswer = undefined;
    return answer;
  }
  return JSON.parse(JSON.stringify(filter === "all" ? [...list] : filterItems(list, filter)));
}

// Mutations: each resolves when the change is saved and rejects with an ApiError otherwise.
export function createItem(fields: WishFields): Promise<void> {
  return write({ type: "added", fields: fields });
}

export function saveItem(id: string, fields: WishFields): Promise<void> {
  return write({ type: "updated", id: id, fields: fields });
}

export function deleteItem(id: string): Promise<void> {
  return write({ type: "removed", id: id });
}

export async function setAcquired(id: string, acquired: boolean): Promise<void> {
  const item = (await current()).find((one) => one.id === id);
  if (item === undefined) {
    throw new ApiError(404, "No wish " + id);
  }
  return write({ type: "updated", id: id, fields: { name: item.name, price: item.price, category: item.category, acquired: acquired } });
}
