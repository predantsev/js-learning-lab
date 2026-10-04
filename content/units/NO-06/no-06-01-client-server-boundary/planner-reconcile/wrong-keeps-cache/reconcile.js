// Mistake: reports what changed, but keeps showing the cached copy as if it were the truth.
export function reconcile(cache, serverList) {
  const onServer = new Map(serverList.map((record) => [record.id, record]));
  const stale = [];
  const deleted = [];
  for (const cached of cache) {
    const current = onServer.get(cached.id);
    if (current === undefined) deleted.push(cached.id);
    else if (Object.keys(cached).some((field) => cached[field] !== current[field])) stale.push(cached.id);
  }
  return { records: cache, stale, deleted };
}
