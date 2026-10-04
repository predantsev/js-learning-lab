// Mistake: looks only for changed records, so a cached record the server no longer has is skipped silently.
export function reconcile(cache, serverList) {
  const stale = [];
  for (const cached of cache) {
    const current = serverList.find((record) => record.id === cached.id);
    if (current && Object.keys(current).some((field) => cached[field] !== current[field])) stale.push(cached.id);
  }
  return { records: serverList, stale, deleted: [] };
}
