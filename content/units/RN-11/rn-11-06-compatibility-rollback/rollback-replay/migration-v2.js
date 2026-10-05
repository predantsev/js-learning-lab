// Build 3's migration: schema v1 → v2. It replaced `done` with a `status` field.
export function migrateToV2(snapshot) {
  return {
    schemaVersion: 2,
    minReaderVersion: 2,
    records: snapshot.records.map(({ done, ...task }) => ({ ...task, status: done ? 'done' : 'pending' })),
  };
}
