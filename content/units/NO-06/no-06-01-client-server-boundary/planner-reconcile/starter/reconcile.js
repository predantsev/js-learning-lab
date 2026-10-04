// Reconciles the client's cached copy with the list the server answered just now.
// Returns { records, stale, deleted }:
//   records — the records to show;
//   stale   — ids of cached records whose server version differs in at least one field;
//   deleted — ids of cached records the server no longer has.
export function reconcile(cache, serverList) {
  // TODO
  return { records: cache, stale: [], deleted: [] };
}
