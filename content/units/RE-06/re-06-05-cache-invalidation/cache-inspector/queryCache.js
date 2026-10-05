// A tiny query cache: a Map from a key text ("wishes:all") to the data of that query.
// Components subscribe to hear about every change.
const entries = new Map();
const listeners = new Set();

function notify() {
  for (const listener of listeners) listener();
}

export const cache = {
  get: (key) => entries.get(key),
  has: (key) => entries.has(key),
  set(key, data) {
    entries.set(key, data);
    notify();
  },
  // Forgets every entry whose key starts with the prefix.
  invalidate(prefix) {
    for (const key of [...entries.keys()]) {
      if (key.startsWith(prefix)) entries.delete(key);
    }
    console.log(`invalidate "${prefix}"`);
    notify();
  },
  clear() {
    entries.clear();
    console.log("clear the whole cache");
    notify();
  },
  keys: () => [...entries.keys()],
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
