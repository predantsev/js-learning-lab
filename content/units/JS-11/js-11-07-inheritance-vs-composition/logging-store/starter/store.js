// A small key-value store. Its methods use `this`, so they only work
// when they are called on the store itself.
export class MemoryStore {
  #data = {};

  get(key) {
    return this.#data[key];
  }

  set(key, value) {
    this.#data[key] = value;
  }
}
