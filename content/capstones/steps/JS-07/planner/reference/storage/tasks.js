// Saving and loading the tasks. The storage (localStorage or a stand-in) is a parameter,
// so these functions work with any object that has getItem and setItem.
import { validateTask } from "../domain/tasks.js";

const KEY = "jsll.planner.v1";
const BACKUP_KEY = "jsll.planner.v1.backup";

// A saved task is usable when it is an object with a text id, title and priority, passes
// validateTask, its done is true or false and its due date is null or text.
function isUsableTask(item) {
  return (
    item !== null &&
    typeof item === "object" &&
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    validateTask(item).ok &&
    typeof item.priority === "string" &&
    typeof item.done === "boolean" &&
    (item.dueDate === null || typeof item.dueDate === "string")
  );
}

// Reads the saved tasks. Returns { ok: true, tasks } or { ok: false, reason }, where reason is
// "missing" (nothing saved), "unparsable" (not JSON), "wrong-version" (not
// { schemaVersion: 1, records: array }) or "invalid-record" (a saved task is not usable).
// For the last three it first copies the saved text under the backup key.
// It never changes the text saved under the main key.
export function loadTasks(storage) {
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
  if (!saved.records.every(isUsableTask)) {
    return fail("invalid-record");
  }
  return { ok: true, tasks: saved.records };
}

// Saves the list as { schemaVersion: 1, records }.
export function saveTasks(storage, list) {
  storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: list }));
}
