export const CURRENT_VERSION = 1;

// v0 (an older app version): a task had `due` — 'YYYY-MM-DD', or '' (or no `due` at all) when it had no date.
// v1 (now): a task has `dueDate` — 'YYYY-MM-DD' or null — and no `due`.
//
// migrate(snapshot) returns
//   { ok: true, snapshot }                     the snapshot at CURRENT_VERSION
//   { ok: false, reason: 'newer' }             written by a newer app version
//   { ok: false, reason: 'invalid' }           not a { schemaVersion: number, records: [...] } object
export function migrate(snapshot) {
  // TODO
  return { ok: false, reason: 'invalid' };
}
