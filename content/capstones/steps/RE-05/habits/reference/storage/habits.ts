// Saving and loading the habits. The storage (localStorage or a stand-in) is a parameter,
// so these functions work with any object that has getItem and setItem.
import { validateHabit, isCalendarDate, uniqueSortedDays } from "../domain/habits.ts";
import type { Habit } from "../domain/habits.ts";

const KEY = "jsll.habits.v1";
const BACKUP_KEY = "jsll.habits.v1.backup";

// What the functions need from a storage: localStorage has these two methods, and so does a
// stand-in object in the tests.
export type TextStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type LoadReason = "missing" | "unparsable" | "wrong-version" | "invalid-record" | "duplicate-id";

export type LoadResult = { ok: true; habits: Habit[] } | { ok: false; reason: LoadReason };

// A saved habit arrives as `unknown`: JSON.parse can return anything, and tsc cannot know what was
// saved. This type predicate checks every field at runtime; where it returns true, tsc treats the
// value as a Habit. Completions that are not sorted, repeat a day or are not "YYYY-MM-DD" fail.
// Exported: data/fixtures.js checks the starting records with the same function.
export function isUsableHabit(value: unknown): value is Habit {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("id" in value) || typeof value.id !== "string") {
    return false;
  }
  if (!("name" in value) || typeof value.name !== "string") {
    return false;
  }
  if (!("frequency" in value) || typeof value.frequency !== "string") {
    return false;
  }
  if (!("active" in value) || typeof value.active !== "boolean") {
    return false;
  }
  if (!("completions" in value) || !Array.isArray(value.completions)) {
    return false;
  }
  // The completions must be calendar dates, each once, in ascending order: the same array that
  // uniqueSortedDays makes from them.
  const completions: unknown[] = value.completions;
  if (!completions.every(isCalendarDate)) {
    return false;
  }
  const canonical = uniqueSortedDays(completions);
  if (canonical.length !== completions.length || canonical.some((day, index) => day !== completions[index])) {
    return false;
  }
  return validateHabit({ name: value.name, frequency: value.frequency }).ok;
}

// Reads the saved habits. Returns { ok: true, habits } or { ok: false, reason }, where reason is
// "missing" (nothing saved), "unparsable" (not JSON), "wrong-version" (not
// { schemaVersion: 1, records: array }), "invalid-record" (a saved habit is not usable) or
// "duplicate-id" (two saved habits share an id). For every reason but "missing" it first copies
// the saved text under the backup key. It never changes the text saved under the main key.
export function loadHabits(storage: TextStore): LoadResult {
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
  if (!records.every(isUsableHabit)) {
    return fail("invalid-record");
  }
  // Here tsc knows that records is Habit[]: every() with a type predicate narrows the array.
  if (new Set(records.map((item) => item.id)).size !== records.length) {
    return fail("duplicate-id");
  }
  return { ok: true, habits: records };
}

// Saves the list as { schemaVersion: 1, records }.
export function saveHabits(storage: TextStore, list: Habit[]): void {
  storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: list }));
}
