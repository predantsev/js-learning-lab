import { MemoryStore } from "./store.js";

// Return a NEW object with get(key) and set(key, value) that
// - writes "get <key>" or "set <key>" with log(message) first,
// - then passes the call on to the same method of the given store
//   and returns whatever the store returns.
// Do not change the store and do not inherit from it: wrap it.
function withLogging(store, log) {
  const logged = Object.create(store);
  logged.get = function (key) {
    log("get " + key);
    return store.get(key);
  };
  logged.set = function (key, value) {
    log("set " + key);
    return store.set(key, value);
  };
  return logged;
}

const lines = [];
const logged = withLogging(new MemoryStore(), (message) => lines.push(message));
logged.set("w-01", "%%lamp%%");
console.log(logged.get("w-01"));
console.log(lines.join(" | "));
