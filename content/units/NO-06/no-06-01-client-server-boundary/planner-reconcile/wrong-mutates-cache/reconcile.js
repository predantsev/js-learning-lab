// Mistake: "repairs" the cached records in place, so the caller's copy changes behind its back.
export function reconcile(cache, serverList) {
  const onServer = new Map(serverList.map((record) => [record.id, record]));
  const stale = [];
  const deleted = [];
  for (const cached of cache) {
    const current = onServer.get(cached.id);
    if (current === undefined) {
      deleted.push(cached.id);
    } else if (Object.keys(cached).some((field) => cached[field] !== current[field])) {
      stale.push(cached.id);
      Object.assign(cached, current);
    }
  }
  return { records: serverList, stale, deleted };
}
