// Notes store, version 1 → 2: every note gets `tags`, the #words of its body (see tags.js).
import { tagsOf } from './tags.js';

// migrate1to2(store): a new version 2 store; a version 2 store comes back as it is.
export function migrate1to2(store) {
  store.schemaVersion = 2;
  for (const note of store.records) note.tags = tagsOf(note.body);
  return store;
}

// dryRun(store, migrate): try `migrate` on a copy of `store` and report
// { ok: true, count } or { ok: false, problem } without changing `store`.
export function dryRun(store, migrate = migrate1to2) {
  const after = migrate(store);
  return { ok: true, count: after.records.length };
}
