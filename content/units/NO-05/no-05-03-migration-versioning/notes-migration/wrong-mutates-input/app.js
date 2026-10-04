// Notes store, version 1 → 2: every note gets `tags`, the #words of its body (see tags.js).
// Mistake: it adds tags to the notes of the store it was given.
import { tagsOf } from './tags.js';

// migrate1to2(store): a new version 2 store; a version 2 store comes back as it is.
export function migrate1to2(store) {
  if (store.schemaVersion === 2) return store;
  if (store.schemaVersion !== 1) throw new Error(`cannot migrate schemaVersion ${store.schemaVersion}`);
  const records = store.records.map((note) => {
    if (typeof note.body !== 'string') throw new Error(`${note.id}: body is not text`);
    note.tags = tagsOf(note.body);
    return note;
  });
  return { schemaVersion: 2, records };
}

// dryRun(store, migrate): try `migrate` on a copy of `store` and report
// { ok: true, count } or { ok: false, problem } without changing `store`.
export function dryRun(store, migrate = migrate1to2) {
  try {
    const after = migrate(structuredClone(store));
    if (after.records.length !== store.records.length) {
      return { ok: false, problem: `count ${store.records.length} → ${after.records.length}` };
    }
    const again = migrate(structuredClone(after));
    if (JSON.stringify(again) !== JSON.stringify(after)) return { ok: false, problem: 'a rerun changes the store' };
    return { ok: true, count: after.records.length };
  } catch (error) {
    return { ok: false, problem: error.message };
  }
}
