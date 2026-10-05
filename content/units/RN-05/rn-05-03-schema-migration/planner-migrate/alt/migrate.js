export const CURRENT_VERSION = 1;

// Another approach: one branch per known version instead of a table of steps.
function v0ToV1(task) {
  const copy = { ...task };
  delete copy.due;
  copy.dueDate = typeof task.due === 'string' && task.due !== '' ? task.due : null;
  return copy;
}

export function migrate(snapshot) {
  if (snapshot === null || typeof snapshot !== 'object') return { ok: false, reason: 'invalid' };
  const { schemaVersion, records } = snapshot;
  if (!Number.isInteger(schemaVersion) || !Array.isArray(records)) return { ok: false, reason: 'invalid' };
  if (schemaVersion === 1) return { ok: true, snapshot };
  if (schemaVersion === 0) return { ok: true, snapshot: { schemaVersion: 1, records: records.map(v0ToV1) } };
  if (schemaVersion > CURRENT_VERSION) return { ok: false, reason: 'newer' };
  return { ok: false, reason: 'invalid' };
}
