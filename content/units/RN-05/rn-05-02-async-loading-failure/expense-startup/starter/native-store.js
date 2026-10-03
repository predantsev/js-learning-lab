// SIMULATION for the preview only: a stand-in for a native async key-value store such as
// @react-native-async-storage/async-storage. Its "device disk" lives outside React, so it
// survives a simulated relaunch (the app's React tree is unmounted and mounted again).
// Like the real module: every call returns a Promise, values must be text, and calls are
// served in the order they were made (a read made before a write sees the old value).
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createSimulatedStore({ entries = {}, readDelayMs = 0, log = true } = {}) {
  const disk = new Map(Object.entries(entries));
  let failNext = false;
  let writes = 0;
  const describe = (text) => {
    if (text === null) return 'null';
    try {
      return `${JSON.parse(text).records.length} records`;
    } catch {
      return `${text.length} characters`;
    }
  };
  return {
    async getItem(key) {
      const value = disk.has(key) ? disk.get(key) : null;
      const fail = failNext;
      failNext = false;
      await wait(readDelayMs);
      if (fail) {
        if (log) console.log(`store: getItem("${key}") → failed`);
        throw new Error(`simulated read failure for ${key}`);
      }
      if (log) console.log(`store: getItem("${key}") → ${describe(value)}`);
      return value;
    },
    async setItem(key, value) {
      if (typeof value !== 'string') {
        throw new TypeError(`setItem("${key}", …): the value must be text, got ${value === null ? 'null' : typeof value}`);
      }
      disk.set(key, value);
      writes += 1;
      if (log) console.log(`store: setItem("${key}", ${describe(value)})`);
    },
    async removeItem(key) {
      disk.delete(key);
      if (log) console.log(`store: removeItem("${key}")`);
    },
    // Controls of the simulation (the preview's "device"), not part of the storage contract.
    failNextRead() {
      failNext = true;
    },
    peek(key) {
      return disk.has(key) ? disk.get(key) : null;
    },
    get writes() {
      return writes;
    },
  };
}
