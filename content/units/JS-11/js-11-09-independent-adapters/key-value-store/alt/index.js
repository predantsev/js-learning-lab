// Part 1: a class.
class KeyValueStore {
  #entries = new Map();

  static fromEntries(entries) {
    if (!Array.isArray(entries)) {
      throw new TypeError("entries must be an array");
    }
    const store = new KeyValueStore();
    for (const [key, value] of entries.map(checkPair)) {
      store.set(key, value);
    }
    return store;
  }

  get(key) {
    return this.#entries.get(key);
  }

  set(key, value) {
    this.#entries.set(key, value);
  }

  delete(key) {
    return this.#entries.delete(key);
  }

  get size() {
    return this.#entries.size;
  }
}

function checkPair(entry) {
  if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== "string") {
    throw new TypeError("every entry must be a [key, value] pair with a text key");
  }
  return entry;
}

// Part 2: a factory that holds a storage object.
class StorageBackedStore {
  #storage;

  constructor(storage) {
    this.#storage = storage;
  }

  get(key) {
    const data = this.#storage.load();
    return Object.hasOwn(data, key) ? data[key] : undefined;
  }

  set(key, value) {
    this.#storage.save({ ...this.#storage.load(), [key]: value });
  }

  delete(key) {
    const data = this.#storage.load();
    const existed = Object.hasOwn(data, key);
    delete data[key];
    this.#storage.save(data);
    return existed;
  }

  get size() {
    return Object.keys(this.#storage.load()).length;
  }
}

function createKeyValueStore(storage) {
  return new StorageBackedStore(storage);
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
