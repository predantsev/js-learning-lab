// SIMULATION (read-only): an in-memory store that behaves like a native async key-value store.
// Every call returns a Promise, a value must be text, and it counts the writes it received.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createDeviceStore({ delayMs = 5, log = false } = {}) {
  const values = new Map();
  let writes = 0;
  return {
    async getItem(key) {
      const value = values.has(key) ? values.get(key) : null;
      await wait(delayMs);
      if (log) console.log(`store: getItem("${key}") → ${value === null ? 'null' : `${value.length} characters`}`);
      return value;
    },
    async setItem(key, value) {
      if (typeof value !== 'string') {
        throw new TypeError(`setItem("${key}", …): the value must be text, got ${value === null ? 'null' : typeof value}`);
      }
      values.set(key, value);
      writes += 1;
      await wait(delayMs);
      if (log) console.log(`store: setItem("${key}", ${value.length} characters)`);
    },
    async removeItem(key) {
      values.delete(key);
      await wait(delayMs);
    },
    // For the checks only: what the "device" holds right now, and how many writes it got.
    peek(key) {
      return values.has(key) ? values.get(key) : null;
    },
    get writes() {
      return writes;
    },
  };
}
