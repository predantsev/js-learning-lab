// Build 2's storage reader (read-only): the code you would "roll back" to.
// It follows the rule from RN-05: a snapshot newer than it understands is read only
// if the snapshot says old readers can read it (minReaderVersion), and it is never overwritten.
export const READER_SCHEMA = 1;

export function readTasks(snapshot) {
  const needs = snapshot.minReaderVersion ?? snapshot.schemaVersion;
  if (needs > READER_SCHEMA) return { status: 'unreadable', tasks: [] };
  return { status: 'ok', tasks: snapshot.records.map(({ id, title, done }) => ({ id, title, done: done === true })) };
}
