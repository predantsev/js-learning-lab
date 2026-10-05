// A hand-written mock of the secure-storage module for the tests.
// It answers what its author expected — not what a device answered.
export const secureStoreMock = {
  async getItemAsync(key) {
    return '{"token":"demo-sync-token"}';
  },
};
