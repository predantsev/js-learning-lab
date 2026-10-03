// SIMULATION for the preview only: a stand-in for a native async key-value store such as
// @react-native-async-storage/async-storage. Its "device disk" lives outside React, so it
// survives a simulated relaunch. Like the real module: every call returns a Promise, values
// must be text, and calls are served in the order they were made.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createSimulatedStore({ entries = {}, readDelayMs = 0, log = true } = {}) {
  const disk = new Map(Object.entries(entries));
  let writes = 0;
  const short = (text) => (text === null ? 'null' : `${text.length} characters`);
  return {
    async getItem(key) {
      const value = disk.has(key) ? disk.get(key) : null;
      await wait(readDelayMs);
      if (log) console.log(`store: getItem("${key}") → ${short(value)}`);
      return value;
    },
    async setItem(key, value) {
      if (typeof value !== 'string') {
        throw new TypeError(`setItem("${key}", …): the value must be text, got ${value === null ? 'null' : typeof value}`);
      }
      disk.set(key, value);
      writes += 1;
      if (log) console.log(`store: setItem("${key}", ${short(value)})`);
    },
    async removeItem(key) {
      disk.delete(key);
      if (log) console.log(`store: removeItem("${key}")`);
    },
    // Controls of the simulation (the preview's "device"), not part of the storage contract.
    reset(next) {
      disk.clear();
      for (const [key, value] of Object.entries(next)) disk.set(key, value);
    },
    peek(key) {
      return disk.has(key) ? disk.get(key) : null;
    },
    get writes() {
      return writes;
    },
  };
}
