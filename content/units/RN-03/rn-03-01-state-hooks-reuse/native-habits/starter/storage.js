// storage.js: an in-memory storage for the preview. It remembers every save.
export const memoryStorage = {
  saves: [],
  save(habits) {
    this.saves.push(habits);
  },
  last() {
    return this.saves[this.saves.length - 1];
  },
};
