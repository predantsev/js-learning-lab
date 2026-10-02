// Part 1: a class.
class KeyValueStore {
  #data = {};

  static fromEntries(entries) {
    if (!Array.isArray(entries)) {
      throw new TypeError("entries must be an array");
    }
    const store = new KeyValueStore();
    for (const entry of entries) {
      if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== "string") {
        throw new TypeError("every entry must be a [key, value] pair with a text key");
      }
      store.set(entry[0], entry[1]);
    }
    return store;
  }

  get(key) {
    return Object.hasOwn(this.#data, key) ? this.#data[key] : undefined;
  }

  set(key, value) {
    this.#data[key] = value;
  }

  delete(key) {
    if (!Object.hasOwn(this.#data, key)) {
      return false;
    }
    delete this.#data[key];
    return true;
  }

  get size() {
    return Object.keys(this.#data).length;
  }
}

// Part 2: a factory that holds a storage object.
function createKeyValueStore(storage) {
  return {
    get(key) {
      const data = storage.load();
      return Object.hasOwn(data, key) ? data[key] : undefined;
    },
    set(key, value) {
      const data = storage.load();
      data[key] = value;
      storage.save(data);
    },
    delete(key) {
      const data = storage.load();
      if (!Object.hasOwn(data, key)) {
        return false;
      }
      delete data[key];
      storage.save(data);
      return true;
    },
    get size() {
      return Object.keys(storage.load()).length;
    },
  };
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
