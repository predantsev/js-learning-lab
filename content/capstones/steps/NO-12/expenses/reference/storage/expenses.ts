// Saving and loading the expenses. The storage (localStorage or a stand-in) is a parameter,
// so these functions work with any object that has getItem and setItem.
import { validateExpense } from "../domain/expenses.ts";
import type { Expense } from "../domain/expenses.ts";

const KEY = "jsll.expenses.v1";
const BACKUP_KEY = "jsll.expenses.v1.backup";

// What the functions need from a storage: localStorage has these two methods, and so does a
// stand-in object in the tests.
export type TextStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type LoadReason = "missing" | "unparsable" | "wrong-version" | "invalid-record" | "duplicate-id";

export type LoadResult = { ok: true; expenses: Expense[] } | { ok: false; reason: LoadReason };

// A saved expense arrives as `unknown`: JSON.parse can return anything, and tsc cannot know what was
// saved. This type predicate checks every field at runtime; where it returns true, tsc treats the
// value as an Expense. An amount of 845.5 or 0, an unknown category or another date format fail
// validateExpense.
// Exported: data/fixtures.js checks the starting records with the same function.
export function isUsableExpense(value: unknown): value is Expense {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("id" in value) || typeof value.id !== "string") {
    return false;
  }
  if (!("label" in value) || typeof value.label !== "string") {
    return false;
  }
  if (!("amountMinor" in value) || typeof value.amountMinor !== "number") {
    return false;
  }
  if (!("date" in value) || typeof value.date !== "string") {
    return false;
  }
  if (!("category" in value) || typeof value.category !== "string") {
    return false;
  }
  // validateExpense requires a whole amount above zero, a known category and a "YYYY-MM-DD" date.
  return validateExpense({ label: value.label, amountMinor: value.amountMinor, date: value.date, category: value.category }).ok;
}

// Reads the saved expenses. Returns { ok: true, expenses } or { ok: false, reason }, where reason is
// "missing" (nothing saved), "unparsable" (not JSON), "wrong-version" (not
// { schemaVersion: 1, records: array }), "invalid-record" (a saved expense is not usable) or
// "duplicate-id" (two saved expenses share an id). For every reason but "missing" it first copies
// the saved text under the backup key. It never changes the text saved under the main key.
export function loadExpenses(storage: TextStore): LoadResult {
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
  if (!records.every(isUsableExpense)) {
    return fail("invalid-record");
  }
  // Here tsc knows that records is Expense[]: every() with a type predicate narrows the array.
  if (new Set(records.map((item) => item.id)).size !== records.length) {
    return fail("duplicate-id");
  }
  return { ok: true, expenses: records };
}

// Saves the list as { schemaVersion: 1, records }.
export function saveExpenses(storage: TextStore, list: Expense[]): void {
  storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: list }));
}
