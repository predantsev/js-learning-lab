// snapshot.js: how the habit tracker turns the saved text back into habits.
//
// Schema history of the saved snapshot { schemaVersion, records }:
//   v1 (app 1.x):   a habit is { id, name, active, completions } — every habit was daily.
//   v2 (app 2.0.0): a habit also has frequency: 'daily' | 'weekly'.
export const CURRENT_VERSION = 2;

function v1ToV2(records) {
  return records.map((habit) => Object.assign({}, habit, { frequency: 'daily' }));
}

// raw: the text from storage.getItem, or null when nothing was saved yet.
// → { ok: true, records } or { ok: false, reason }
export function restoreSnapshot(raw) {
  if (raw === null) return { ok: true, records: [] };
  let snapshot;
  try {
    snapshot = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'unparsable' };
  }
  if (typeof snapshot?.schemaVersion !== 'number' || !Array.isArray(snapshot.records)) return { ok: false, reason: 'invalid' };
  if (snapshot.schemaVersion === 1) return { ok: true, records: v1ToV2(snapshot.records) };
  if (snapshot.schemaVersion === 2) return { ok: true, records: snapshot.records };
  return { ok: false, reason: 'unknown-version' };
}
