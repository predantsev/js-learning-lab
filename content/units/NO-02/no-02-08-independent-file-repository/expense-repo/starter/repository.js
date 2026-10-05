// createFileRepository(dataDir, { maxBytes }): expenses in <dataDir>/expenses.json as
// { schemaVersion: 1, records }, category labels in <dataDir>/categories.json.
// Every method is still a stub: replace them following the task.
export function createFileRepository(dataDir, { maxBytes }) {
  return {
    async list() {
      return [];
    },
    async get(id) {
      return null;
    },
    async save(record) {},
    async remove(id) {
      return false;
    },
    async summary() {
      return {};
    },
    async recover() {},
  };
}
