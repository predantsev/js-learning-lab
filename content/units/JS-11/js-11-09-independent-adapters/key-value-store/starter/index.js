// Part 1: a class.
class KeyValueStore {
}

// Part 2: a factory that holds a storage object.
function createKeyValueStore(storage) {
}

// A short demo. Each part runs on its own: while one design is unfinished,
// its error is printed and the other part (and the checks) still run.
try {
  const store = KeyValueStore.fromEntries([["w-01", "%%headphones%%"], ["w-02", "%%lamp%%"]]);
  store.set("w-03", "%%bicycle%%");
  console.log(store.size);
} catch (error) {
  console.log("class: " + error.name + ": " + error.message);
}

try {
  const storage = {
    saved: {},
    load() {
      return { ...this.saved };
    },
    save(data) {
      this.saved = { ...data };
    },
  };
  const adapter = createKeyValueStore(storage);
  adapter.set("w-01", "%%headphones%%");
  adapter.set("w-01", "%%lamp%%");
  console.log(adapter.get("w-01"));
  console.log(adapter.size);
} catch (error) {
  console.log("factory: " + error.name + ": " + error.message);
}
