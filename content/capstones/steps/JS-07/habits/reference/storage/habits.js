// Saving and loading the habits. The storage (localStorage or a stand-in) is a parameter,
// so these functions work with any object that has getItem and setItem.
import { validateHabit } from "../domain/habits.js";

const KEY = "jsll.habits.v1";
const BACKUP_KEY = "jsll.habits.v1.backup";

// A saved habit is usable when it is an object with a text id, name and frequency, passes
// validateHabit, its active is true or false and its completions are an array of texts.
function isUsableHabit(item) {
  return (
    item !== null &&
    typeof item === "object" &&
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    validateHabit(item).ok &&
    typeof item.frequency === "string" &&
    typeof item.active === "boolean" &&
    Array.isArray(item.completions) &&
    item.completions.every((day) => typeof day === "string")
  );
}

// Reads the saved habits. Returns { ok: true, habits } or { ok: false, reason }, where reason is
// "missing" (nothing saved), "unparsable" (not JSON), "wrong-version" (not
// { schemaVersion: 1, records: array }) or "invalid-record" (a saved habit is not usable).
// For the last three it first copies the saved text under the backup key.
// It never changes the text saved under the main key.
export function loadHabits(storage) {
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
  if (!saved.records.every(isUsableHabit)) {
    return fail("invalid-record");
  }
  return { ok: true, habits: saved.records };
}

// Saves the list as { schemaVersion: 1, records }.
export function saveHabits(storage, list) {
  storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: list }));
}
