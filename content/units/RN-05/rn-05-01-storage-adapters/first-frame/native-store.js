// SIMULATION for the preview only: a stand-in for a native async key-value store such as
// @react-native-async-storage/async-storage. The "device disk" lives in this module, so it
// survives a simulated relaunch (the app's React tree is unmounted and mounted again).
// Like the real module: every call returns a Promise, values must be text, and calls are
// served in the order they were made (a read made before a write sees the old value).
const disk = new Map();
const settings = { readDelayMs: 0, failNextRead: false, describe: (text) => `${text.length} characters` };

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const shown = (value) => (value === null ? 'null' : settings.describe(value));

// Controls of the simulation (the preview's "device"), not part of any storage contract.
export const device = {
  configure(options) {
    Object.assign(settings, options);
  },
  seed(entries) {
    disk.clear();
    for (const [key, value] of Object.entries(entries)) disk.set(key, value);
  },
  peek(key) {
    return disk.has(key) ? disk.get(key) : null;
  },
};

// The store the app talks to: getItem / setItem / removeItem, as in the contract from RN-03.
export const nativeStore = {
  async getItem(key) {
    const value = disk.has(key) ? disk.get(key) : null;
    const fail = settings.failNextRead;
    settings.failNextRead = false;
    await wait(settings.readDelayMs);
    if (fail) {
      console.log(`store: getItem("${key}") → failed`);
      throw new Error(`simulated read failure for ${key}`);
    }
    console.log(`store: getItem("${key}") → ${shown(value)}`);
    return value;
  },
  async setItem(key, value) {
    if (typeof value !== 'string') {
      throw new TypeError(`setItem("${key}", …): the value must be text, got ${value === null ? 'null' : typeof value}`);
    }
    disk.set(key, value);
    console.log(`store: setItem("${key}", ${shown(value)})`);
  },
  async removeItem(key) {
    disk.delete(key);
    console.log(`store: removeItem("${key}")`);
  },
};
