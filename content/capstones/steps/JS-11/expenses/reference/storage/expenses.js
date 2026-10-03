// Saving and loading the expenses. The storage (localStorage or a stand-in) is a parameter,
// so these functions work with any object that has getItem and setItem.
import { validateExpense } from "../domain/expenses.js";

const KEY = "jsll.expenses.v1";
const BACKUP_KEY = "jsll.expenses.v1.backup";

// A saved expense is usable when it is an object with a text id, label and date and passes
// validateExpense (a whole positive amount in kopiykas and a known category).
// Exported: data/fixtures.js checks the starting records with the same function.
export function isUsableExpense(item) {
  return (
    item !== null &&
    typeof item === "object" &&
    typeof item.id === "string" &&
    typeof item.label === "string" &&
    validateExpense(item).ok &&
    typeof item.date === "string"
  );
}

// Reads the saved expenses. Returns { ok: true, expenses } or { ok: false, reason }, where reason is
// "missing" (nothing saved), "unparsable" (not JSON), "wrong-version" (not
// { schemaVersion: 1, records: array }) or "invalid-record" (a saved expense is not usable).
// For the last three it first copies the saved text under the backup key.
// It never changes the text saved under the main key.
export function loadExpenses(storage) {
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
  if (!saved.records.every(isUsableExpense)) {
    return fail("invalid-record");
  }
  return { ok: true, expenses: saved.records };
}

// Saves the list as { schemaVersion: 1, records }.
export function saveExpenses(storage, list) {
  storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: list }));
}
