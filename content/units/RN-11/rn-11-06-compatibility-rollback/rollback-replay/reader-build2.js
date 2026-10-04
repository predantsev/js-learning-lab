// Build 2's storage reader (read-only): the code you would "roll back" to.
// Like the RN-05 rule, it never overwrites a snapshot newer than it understands.
// New here: it reads such a snapshot only if the snapshot says old readers can (minReaderVersion).
export const READER_SCHEMA = 1;

export function readTasks(snapshot) {
  const needs = snapshot.minReaderVersion ?? snapshot.schemaVersion;
  if (needs > READER_SCHEMA) return { status: 'unreadable', tasks: [] };
  return { status: 'ok', tasks: snapshot.records.map(({ id, title, done }) => ({ id, title, done: done === true })) };
}
