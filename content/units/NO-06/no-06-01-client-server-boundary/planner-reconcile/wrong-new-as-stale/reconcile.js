// Mistake: a server record that the copy does not have is reported as stale too, although it is simply new.
export function reconcile(cache, serverList) {
  const changed = cache
    .filter((cached) => {
      const current = serverList.find((record) => record.id === cached.id);
      return current !== undefined && Object.keys(current).some((field) => cached[field] !== current[field]);
    })
    .map((cached) => cached.id);
  const brandNew = serverList.filter((current) => !cache.some((record) => record.id === current.id)).map((current) => current.id);
  const deleted = cache.filter((cached) => !serverList.some((record) => record.id === cached.id)).map((cached) => cached.id);
  return { records: serverList, stale: [...changed, ...brandNew], deleted };
}
