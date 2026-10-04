// Reconciles the client's cached copy with the list the server answered just now.
// Returns { records, stale, deleted }:
//   records — the records to show;
//   stale   — ids of cached records whose server version differs in at least one field;
//   deleted — ids of cached records the server no longer has.
export function reconcile(cache, serverList) {
  const onServer = new Map(serverList.map((record) => [record.id, record]));
  const stale = [];
  const deleted = [];
  for (const cached of cache) {
    const current = onServer.get(cached.id);
    if (current === undefined) {
      deleted.push(cached.id);
      continue;
    }
    const fields = new Set([...Object.keys(cached), ...Object.keys(current)]);
    if ([...fields].some((field) => cached[field] !== current[field])) stale.push(cached.id);
  }
  // The server's list wins: it is what the client shows from now on.
  return { records: serverList.map((record) => ({ ...record })), stale, deleted };
}
