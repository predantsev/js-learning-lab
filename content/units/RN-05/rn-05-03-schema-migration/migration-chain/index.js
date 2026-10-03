// A migration chain for the habit tracker. Each step lifts the records by exactly one version.
const CURRENT_VERSION = 1;

const steps = {
  // v0 → v1: older app versions did not store `frequency`; every habit was daily then.
  0: (records) => records.map((habit) => ({ ...habit, frequency: habit.frequency ?? 'daily' })),
};

function migrate(snapshot) {
  if (typeof snapshot?.schemaVersion !== 'number' || !Array.isArray(snapshot.records)) {
    return { ok: false, reason: 'invalid' };
  }
  if (snapshot.schemaVersion > CURRENT_VERSION) {
    return { ok: false, reason: 'newer' };
  }
  let { schemaVersion, records } = snapshot;
  while (schemaVersion < CURRENT_VERSION) {
    console.log(`  step ${schemaVersion} → ${schemaVersion + 1}`);
    records = steps[schemaVersion](records);
    schemaVersion += 1;
  }
  return { ok: true, snapshot: { schemaVersion, records } };
}

const stored = {
  v0: { schemaVersion: 0, records: [{ id: 'h-01', name: '%%exercise%%' }, { id: 'h-04', name: '%%tidy%%', frequency: 'weekly' }] },
  v1: { schemaVersion: 1, records: [{ id: 'h-02', name: '%%reading%%', frequency: 'daily' }] },
  v2: { schemaVersion: 2, records: [{ id: 'h-03', name: '%%water%%', frequency: 'daily', reminder: '08:00' }] },
  broken: { schemaVersion: 1, habits: [] },
};

for (const [name, snapshot] of Object.entries(stored)) {
  console.log(`${name}:`);
  console.log(' ', JSON.stringify(migrate(snapshot)));
}
