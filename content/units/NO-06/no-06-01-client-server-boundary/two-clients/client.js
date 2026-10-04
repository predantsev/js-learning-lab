// A client that keeps a copy (a cache) of the server's list. The copy is handy to read, but it is not the truth.
export function createClient(name, base) {
  let cache = null; // the last list this client got from the server

  async function load() {
    const response = await fetch(`${base}/v1/records`, { signal: AbortSignal.timeout(2000) });
    cache = await response.json();
  }

  return {
    name,
    // The first call asks the server; later calls answer from the copy.
    async list() {
      if (cache === null) await load();
      return cache;
    },
    // Asks the server again and replaces the copy.
    async refresh() {
      await load();
      return cache;
    },
    // Optimistic: changes the copy first, then tells the server. Returns the server's status.
    async update(id, changes) {
      cache = cache.map((record) => (record.id === id ? { ...record, ...changes } : record));
      const response = await fetch(`${base}/v1/records/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(changes),
        signal: AbortSignal.timeout(2000),
      });
      return response.status;
    },
  };
}
