// The data source the client used until now: records kept in memory, answered as promises.
export function createFixtureSource(records) {
  let stored = records.map((record) => ({ ...record }));
  let next = stored.length + 1;
  return {
    async listRecords() {
      return stored.map((record) => ({ ...record }));
    },
    async createRecord(input) {
      const record = { id: `e-${String(next++).padStart(2, '0')}`, ...input };
      stored.push(record);
      return { ...record };
    },
    async updateRecord(id, changes) {
      stored = stored.map((record) => (record.id === id ? { ...record, ...changes } : record));
      return { ...stored.find((record) => record.id === id) };
    },
  };
}
