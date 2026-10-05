// Reconciles the client's cached copy with the list the server answered just now.
// Returns { records, stale, deleted }:
//   records — the records to show;
//   stale   — ids of cached records whose server version differs in at least one field;
//   deleted — ids of cached records the server no longer has.
export function reconcile(cache, serverList) {
  const sameRecord = (a, b) =>
    Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((field) => a[field] === b[field]);
  return {
    records: serverList,
    stale: cache
      .filter((cached) => serverList.some((record) => record.id === cached.id && !sameRecord(cached, record)))
      .map((cached) => cached.id),
    deleted: cache.filter((cached) => !serverList.some((record) => record.id === cached.id)).map((cached) => cached.id),
  };
}
