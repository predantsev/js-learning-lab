export const CURRENT_VERSION = 1;

// v0 (an older app version): a task had `due` — 'YYYY-MM-DD', or '' (or no `due` at all) when it had no date.
// v1 (now): a task has `dueDate` — 'YYYY-MM-DD' or null — and no `due`.
//
// migrate(snapshot) returns
//   { ok: true, snapshot }                     the snapshot at CURRENT_VERSION
//   { ok: false, reason: 'newer' }             written by a newer app version
//   { ok: false, reason: 'invalid' }           not a { schemaVersion: number, records: [...] } object
// Mistake: has no check for versions it does not know, so a newer snapshot passes as current.
const steps = {
  0: (records) =>
    records.map(({ due, ...task }) => ({ ...task, dueDate: due ? due : null })),
};

export function migrate(snapshot) {
  if (typeof snapshot?.schemaVersion !== 'number' || !Array.isArray(snapshot.records)) {
    return { ok: false, reason: 'invalid' };
  }
  let { schemaVersion, records } = snapshot;
  while (schemaVersion < CURRENT_VERSION) {
    records = steps[schemaVersion](records);
    schemaVersion += 1;
  }
  return { ok: true, snapshot: { schemaVersion, records } };
}
