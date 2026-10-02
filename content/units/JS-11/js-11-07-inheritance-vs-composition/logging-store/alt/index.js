import { MemoryStore } from "./store.js";

class LoggingStore {
  #store;
  #log;

  constructor(store, log) {
    this.#store = store;
    this.#log = log;
  }

  get(key) {
    this.#log("get " + key);
    return this.#store.get(key);
  }

  set(key, value) {
    this.#log("set " + key);
    return this.#store.set(key, value);
  }
}

// Return a NEW object with get(key) and set(key, value) that
// - writes "get <key>" or "set <key>" with log(message) first,
// - then passes the call on to the same method of the given store
//   and returns whatever the store returns.
// Do not change the store and do not inherit from it: wrap it.
function withLogging(store, log) {
  return new LoggingStore(store, log);
}

const lines = [];
const logged = withLogging(new MemoryStore(), (message) => lines.push(message));
logged.set("w-01", "%%lamp%%");
console.log(logged.get("w-01"));
console.log(lines.join(" | "));
