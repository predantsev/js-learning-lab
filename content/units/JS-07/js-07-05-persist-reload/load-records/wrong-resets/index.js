const KEY = "jsll.planner.v1";
const BACKUP_KEY = "jsll.planner.v1.backup";

// isDay(text) answers whether text looks like a "YYYY-MM-DD" day. Ready-made.
function isDay(text) {
  if (typeof text !== "string" || text.length !== 10 || text[4] !== "-" || text[7] !== "-") {
    return false;
  }
  const digits = text.slice(0, 4) + text.slice(5, 7) + text.slice(8, 10);
  return !Number.isNaN(Number(digits));
}

// validateTask(task) returns { ok: true, value } or { ok: false, errors }. Ready-made.
function validateTask(task) {
  if (typeof task !== "object" || task === null) {
    return { ok: false, errors: { task: "not-an-object" } };
  }
  const errors = {};
  if (typeof task.id !== "string" || task.id === "") {
    errors.id = "required";
  }
  if (typeof task.title !== "string" || task.title.trim() === "") {
    errors.title = "required";
  }
  if (task.dueDate !== null && !isDay(task.dueDate)) {
    errors.dueDate = "not-a-day";
  }
  if (typeof task.done !== "boolean") {
    errors.done = "not-boolean";
  }
  if (task.priority !== "low" && task.priority !== "normal" && task.priority !== "high") {
    errors.priority = "unknown";
  }
  const hasErrors = Object.keys(errors).length > 0;
  return hasErrors ? { ok: false, errors: errors } : { ok: true, value: task };
}

// After keeping the backup, it also replaces the stored text with an empty list: loading changes data.
function loadRecords(storage) {
  const text = storage.getItem(KEY);
  if (text === null) {
    return { ok: false, reason: "missing" };
  }
  const reset = (reason) => {
    storage.setItem(BACKUP_KEY, text);
    storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: [] }));
    return { ok: false, reason: reason };
  };
  let saved;
  try {
    saved = JSON.parse(text);
  } catch (error) {
    return reset("unparsable");
  }
  if (saved?.schemaVersion !== 1 || !Array.isArray(saved.records)) {
    return reset("wrong-version");
  }
  for (const task of saved.records) {
    if (!validateTask(task).ok) {
      return reset("invalid-record");
    }
  }
  return { ok: true, records: saved.records };
}

// Try it with this exercise's own storage. To store something, add a line above this one, e.g.
// localStorage.setItem(KEY, '{"schemaVersion":1,"records":[]}');
console.log(loadRecords(localStorage));
