// Mistake: walks only the server's list, so a record the server deleted is never noticed.
export function reconcile(cache, serverList) {
  const stale = [];
  for (const current of serverList) {
    const cached = cache.find((record) => record.id === current.id);
    if (cached && Object.keys(current).some((field) => cached[field] !== current[field])) stale.push(current.id);
  }
  return { records: serverList, stale, deleted: [] };
}
