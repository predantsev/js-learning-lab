// A stand-in for the mock service from RN-06, kept in memory, plus the adapter the screen uses.
// It answers after 50 ms, as a request would.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createMockService(records) {
  let stored = records.map((record) => ({ ...record }));
  return {
    async get() {
      await wait(50);
      return stored.map((record) => ({ ...record }));
    },
    async patch(id, change) {
      await wait(50);
      stored = stored.map((record) => (record.id === id ? { ...record, ...change } : record));
    },
    records: () => stored,
  };
}

export function createTaskAdapter(service) {
  return {
    loadTasks: () => service.get(),
    saveTask: (id, change) => service.patch(id, change),
  };
}
