// Another valid shape: a for loop, JSON round trip as the copy and a list of checks.
import { tagsOf } from './tags.js';

export function migrate1to2(store) {
  if (store.schemaVersion >= 2) return store;
  const records = [];
  for (const note of store.records) {
    if (typeof note.body !== 'string') throw new TypeError(`note ${note.id} has no text body`);
    records.push({ id: note.id, title: note.title, body: note.body, pinned: note.pinned, tags: tagsOf(note.body) });
  }
  return { ...store, schemaVersion: 2, records };
}

const copyOf = (value) => JSON.parse(JSON.stringify(value));

export function dryRun(store, migrate = migrate1to2) {
  let after;
  let again;
  try {
    after = migrate(copyOf(store));
    again = migrate(copyOf(after));
  } catch (error) {
    return { ok: false, problem: `the migration threw: ${error.message}` };
  }
  const checks = [
    [after.records.length === store.records.length, 'record count changed'],
    [JSON.stringify(again) === JSON.stringify(after), 'not safe to rerun'],
  ];
  const failed = checks.find(([passed]) => !passed);
  return failed ? { ok: false, problem: failed[1] } : { ok: true, count: store.records.length };
}
