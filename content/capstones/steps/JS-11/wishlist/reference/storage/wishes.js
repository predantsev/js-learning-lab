// Saving and loading the wishes. The storage (localStorage or a stand-in) is a parameter,
// so these functions work with any object that has getItem and setItem.
import { validateItem } from "../domain/wishes.js";

const KEY = "jsll.wishlist.v1";
const BACKUP_KEY = "jsll.wishlist.v1.backup";

// A saved wish is usable when it is an object with a text id and a text name, passes
// validateItem, and its other fields have the right types. A price saved as the text "80"
// fails validateItem.
// Exported: data/fixtures.js checks the starting records with the same function.
export function isUsableItem(item) {
  return (
    item !== null &&
    typeof item === "object" &&
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    validateItem(item).ok &&
    typeof item.acquired === "boolean" &&
    (item.category === null || typeof item.category === "string")
  );
}

// Reads the saved wishes. Returns { ok: true, items } or { ok: false, reason }, where reason is
// "missing" (nothing saved), "unparsable" (not JSON), "wrong-version" (not
// { schemaVersion: 1, records: array }) or "invalid-record" (a saved wish is not usable).
// For the last three it first copies the saved text under the backup key.
// It never changes the text saved under the main key.
export function loadItems(storage) {
  const text = storage.getItem(KEY);
  if (text === null) {
    return { ok: false, reason: "missing" };
  }
  const fail = (reason) => {
    storage.setItem(BACKUP_KEY, text);
    return { ok: false, reason: reason };
  };
  let saved;
  try {
    saved = JSON.parse(text);
  } catch (error) {
    return fail("unparsable");
  }
  if (saved?.schemaVersion !== 1 || !Array.isArray(saved.records)) {
    return fail("wrong-version");
  }
  if (!saved.records.every(isUsableItem)) {
    return fail("invalid-record");
  }
  return { ok: true, items: saved.records };
}

// Saves the list as { schemaVersion: 1, records }.
export function saveItems(storage, list) {
  storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: list }));
}
