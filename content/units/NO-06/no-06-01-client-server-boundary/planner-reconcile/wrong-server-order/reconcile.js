// Mistake: finds stale records by walking the server's list, so they come out in the server's order.
export function reconcile(cache, serverList) {
  const stale = [];
  for (const current of serverList) {
    const cached = cache.find((record) => record.id === current.id);
    if (cached && Object.keys(current).some((field) => cached[field] !== current[field])) stale.push(current.id);
  }
  const deleted = cache.filter((cached) => !serverList.some((record) => record.id === cached.id)).map((cached) => cached.id);
  return { records: serverList, stale, deleted };
}
