// A cache that never holds more than `limit` entries.
// set(key, value) stores a value; when that makes more than `limit` entries,
// the oldest entry is removed. Setting an existing key makes it the newest.
// get(key) returns the value or undefined (reading does not change the order).
// size is the number of entries.
function createCache(limit) {
  return {
    set(key, value) {
    },
    get(key) {
    },
    get size() {
      return 0;
    },
  };
}

const recent = createCache(2);
recent.set("w-01", "%%headphones%%");
recent.set("w-02", "%%lamp%%");
recent.set("w-03", "%%bicycle%%");
console.log(recent.size, recent.get("w-01"), recent.get("w-03"));
