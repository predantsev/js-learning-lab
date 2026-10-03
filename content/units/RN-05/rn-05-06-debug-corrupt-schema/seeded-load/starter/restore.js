// restore.js (read-only): a teammate's restore step for the planner — parse, migrate, validate.
// restoreSnapshot(raw) → { ok: true, records } | { ok: false, reason }. It never throws.
const CURRENT_VERSION = 1;
const PRIORITIES = ['low', 'normal', 'high'];

// v0 → v1: older builds stored status: 'done' | 'open' instead of done: boolean.
function migrate(snapshot) {
  if (typeof snapshot?.schemaVersion !== 'number' || !Array.isArray(snapshot.records)) return { ok: false, reason: 'invalid' };
  if (snapshot.schemaVersion > CURRENT_VERSION) return { ok: false, reason: 'newer' };
  let records = snapshot.records;
  if (snapshot.schemaVersion === 0) {
    records = records.map(({ status, ...task }) => ({ ...task, done: status === 'done' }));
  }
  return { ok: true, records };
}

function validateTask(input) {
  if (typeof input !== 'object' || input === null) return { ok: false };
  const { id, title, dueDate, done, priority } = input;
  const valid =
    typeof id === 'string' && id !== '' &&
    typeof title === 'string' && title.trim() !== '' &&
    (dueDate === null || typeof dueDate === 'string') &&
    typeof done === 'boolean' &&
    PRIORITIES.includes(priority);
  return valid ? { ok: true, value: { id, title: title.trim(), dueDate, done, priority } } : { ok: false };
}

export function restoreSnapshot(raw) {
  if (raw === null) return { ok: true, records: [] };
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'unparsable' };
  }
  const migrated = migrate(parsed);
  if (!migrated.ok) return migrated;
  const records = [];
  for (const item of migrated.records) {
    const result = validateTask(item);
    if (!result.ok) return { ok: false, reason: 'invalid-record' };
    records.push(result.value);
  }
  return { ok: true, records };
}
