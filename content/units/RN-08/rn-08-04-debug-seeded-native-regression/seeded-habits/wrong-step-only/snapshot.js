// snapshot.js: how the habit tracker turns the saved text back into habits.
//
// Schema history of the saved snapshot { schemaVersion, records }:
//   v1 (app 1.x):   a habit is { id, name, active, completions } — every habit was daily.
//   v2 (app 2.0.0): a habit also has frequency: 'daily' | 'weekly'.
export const CURRENT_VERSION = 2;

const steps = {
  // v1 → v2: every 1.x habit was daily.
  1: (records) => records.map((habit) => ({ ...habit, frequency: 'daily' })),
};

export function migrate(snapshot) {
  if (typeof snapshot?.schemaVersion !== 'number' || !Array.isArray(snapshot.records)) {
    throw new Error('not a habits snapshot');
  }
  if (snapshot.schemaVersion > CURRENT_VERSION) {
    throw new Error(`snapshot v${snapshot.schemaVersion} is newer than this app`);
  }
  let { schemaVersion, records } = snapshot;
  while (schemaVersion < CURRENT_VERSION) {
    records = steps[schemaVersion](records);
    schemaVersion += 1;
  }
  return { schemaVersion, records };
}

// raw: the text from storage.getItem, or null when nothing was saved yet.
// → { ok: true, records } or { ok: false, reason }
export function restoreSnapshot(raw) {
  if (raw === null) return { ok: true, records: [] };
  try {
    return { ok: true, records: migrate(JSON.parse(raw)).records };
  } catch {
    // Something odd on disk: start with a clean list.
    return { ok: true, records: [] };
  }
}
