// Saving and loading the tasks. The storage (localStorage or a stand-in) is a parameter,
// so these functions work with any object that has getItem and setItem.
import { validateTask } from "../domain/tasks.ts";
import type { Task } from "../domain/tasks.ts";

const KEY = "jsll.planner.v1";
const BACKUP_KEY = "jsll.planner.v1.backup";

// What the functions need from a storage: localStorage has these two methods, and so does a
// stand-in object in the tests.
export type TextStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type LoadReason = "missing" | "unparsable" | "wrong-version" | "invalid-record" | "duplicate-id";

export type LoadResult = { ok: true; tasks: Task[] } | { ok: false; reason: LoadReason };

// A saved task arrives as `unknown`: JSON.parse can return anything, and tsc cannot know what was
// saved. This type predicate checks every field at runtime; where it returns true, tsc treats the
// value as a Task. A priority other than the three known ones and a due date that is not
// "YYYY-MM-DD" fail validateTask.
// Exported: data/fixtures.js checks the starting records with the same function.
export function isUsableTask(value: unknown): value is Task {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("id" in value) || typeof value.id !== "string") {
    return false;
  }
  if (!("title" in value) || typeof value.title !== "string") {
    return false;
  }
  if (!("dueDate" in value) || (value.dueDate !== null && typeof value.dueDate !== "string")) {
    return false;
  }
  if (!("done" in value) || typeof value.done !== "boolean") {
    return false;
  }
  if (!("priority" in value) || typeof value.priority !== "string") {
    return false;
  }
  return validateTask({ title: value.title, dueDate: value.dueDate, priority: value.priority }).ok;
}

// Reads the saved tasks. Returns { ok: true, tasks } or { ok: false, reason }, where reason is
// "missing" (nothing saved), "unparsable" (not JSON), "wrong-version" (not
// { schemaVersion: 1, records: array }), "invalid-record" (a saved task is not usable) or
// "duplicate-id" (two saved tasks share an id). For every reason but "missing" it first copies
// the saved text under the backup key. It never changes the text saved under the main key.
export function loadTasks(storage: TextStore): LoadResult {
  const text = storage.getItem(KEY);
  if (text === null) {
    return { ok: false, reason: "missing" };
  }
  const fail = (reason: LoadReason): LoadResult => {
    storage.setItem(BACKUP_KEY, text);
    return { ok: false, reason: reason };
  };
  let saved: unknown;
  try {
    saved = JSON.parse(text);
  } catch (error) {
    return fail("unparsable");
  }
  if (typeof saved !== "object" || saved === null || !("schemaVersion" in saved) || saved.schemaVersion !== 1 || !("records" in saved) || !Array.isArray(saved.records)) {
    return fail("wrong-version");
  }
  const records: unknown[] = saved.records;
  if (!records.every(isUsableTask)) {
    return fail("invalid-record");
  }
  // Here tsc knows that records is Task[]: every() with a type predicate narrows the array.
  if (new Set(records.map((item) => item.id)).size !== records.length) {
    return fail("duplicate-id");
  }
  return { ok: true, tasks: records };
}

// Saves the list as { schemaVersion: 1, records }.
export function saveTasks(storage: TextStore, list: Task[]): void {
  storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: list }));
}
