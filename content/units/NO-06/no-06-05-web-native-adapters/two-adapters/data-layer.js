// The shared data layer: the same code for the web and the native client. It knows nothing about the
// platform — the base URL, the storage and the network status come from the adapter.
export function createDataLayer(adapter) {
  const CACHE_KEY = 'planner.records.v1';
  return {
    // Answers { records, stale, reason }: fresh server data, or the last saved copy marked stale.
    async listRecords() {
      if (!(await adapter.isOnline())) return fromCache('offline');
      try {
        const response = await fetch(`${adapter.baseUrl}/v1/records`, { signal: AbortSignal.timeout(1000) });
        if (!response.ok) return fromCache(`HTTP ${response.status}`);
        const records = await response.json();
        await adapter.storage.set(CACHE_KEY, JSON.stringify(records));
        return { records, stale: false, reason: null };
      } catch (error) {
        return fromCache(`unreachable (${error.name})`);
      }
    },
  };

  async function fromCache(reason) {
    const saved = await adapter.storage.get(CACHE_KEY);
    return { records: saved === null ? [] : JSON.parse(saved), stale: true, reason };
  }
}
