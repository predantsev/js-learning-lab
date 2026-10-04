// Mistake: every server record that does not match the cache counts as stale — also a brand-new one.
export function reconcile(cache, serverList) {
  const stale = serverList
    .filter((current) => {
      const cached = cache.find((record) => record.id === current.id);
      return !cached || Object.keys(current).some((field) => cached[field] !== current[field]);
    })
    .map((current) => current.id);
  const deleted = cache.filter((cached) => !serverList.some((record) => record.id === cached.id)).map((cached) => cached.id);
  return { records: serverList, stale, deleted };
}
