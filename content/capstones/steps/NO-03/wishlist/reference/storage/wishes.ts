// Saving and loading the wishes. The storage (localStorage or a stand-in) is a parameter,
// so these functions work with any object that has getItem and setItem.
import { validateItem } from "../domain/wishes.ts";
import type { Wish } from "../domain/wishes.ts";

const KEY = "jsll.wishlist.v1";
const BACKUP_KEY = "jsll.wishlist.v1.backup";

// What the functions need from a storage: localStorage has these two methods, and so does a
// stand-in object in the tests.
export type TextStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type LoadReason = "missing" | "unparsable" | "wrong-version" | "invalid-record" | "duplicate-id";

export type LoadResult = { ok: true; items: Wish[] } | { ok: false; reason: LoadReason };

// A saved wish arrives as `unknown`: JSON.parse can return anything, and tsc cannot know what was
// saved. This type predicate checks every field at runtime; where it returns true, tsc treats the
// value as a Wish. A price saved as the text "80" or as 12.5 fails validateItem.
// Exported: data/fixtures.js checks the starting records with the same function.
export function isUsableItem(value: unknown): value is Wish {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("id" in value) || typeof value.id !== "string") {
    return false;
  }
  if (!("name" in value) || typeof value.name !== "string") {
    return false;
  }
  if (!("price" in value) || (value.price !== null && typeof value.price !== "number")) {
    return false;
  }
  if (!("acquired" in value) || typeof value.acquired !== "boolean") {
    return false;
  }
  if (!("category" in value) || (value.category !== null && typeof value.category !== "string")) {
    return false;
  }
  return validateItem({ name: value.name, price: value.price }).ok;
}

// Reads the saved wishes. Returns { ok: true, items } or { ok: false, reason }, where reason is
// "missing" (nothing saved), "unparsable" (not JSON), "wrong-version" (not
// { schemaVersion: 1, records: array }), "invalid-record" (a saved wish is not usable) or
// "duplicate-id" (two saved wishes share an id). For every reason but "missing" it first copies
// the saved text under the backup key. It never changes the text saved under the main key.
export function loadItems(storage: TextStore): LoadResult {
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
  if (!records.every(isUsableItem)) {
    return fail("invalid-record");
  }
  // Here tsc knows that records is Wish[]: every() with a type predicate narrows the array.
  if (new Set(records.map((item) => item.id)).size !== records.length) {
    return fail("duplicate-id");
  }
  return { ok: true, items: records };
}

// Saves the list as { schemaVersion: 1, records }.
export function saveItems(storage: TextStore, list: Wish[]): void {
  storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: list }));
}
