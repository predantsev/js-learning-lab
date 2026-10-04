// Mistake: compares only the fields that "usually" change, so a new due date or priority goes unnoticed.
export function reconcile(cache, serverList) {
  const onServer = new Map(serverList.map((record) => [record.id, record]));
  const stale = [];
  const deleted = [];
  for (const cached of cache) {
    const current = onServer.get(cached.id);
    if (current === undefined) deleted.push(cached.id);
    else if (cached.title !== current.title || cached.done !== current.done) stale.push(cached.id);
  }
  return { records: serverList, stale, deleted };
}
