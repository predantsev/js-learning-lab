// The habits repository. Reads are answered from memory (fast); every change is also written
// through to the JSON file { schemaVersion, records }, replaced atomically (temp file + rename).
import { randomUUID } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';

async function writeAtomic(file, value) {
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value));
  await rename(temp, file);
}

export async function openRepository(file) {
  const habits = JSON.parse(await readFile(file, 'utf8')).records;
  return {
    list() {
      return habits;
    },
    // update(id, changes): merge `changes` into the habit with this id → the habit, or null.
    async update(id, changes) {
      const habit = habits.find((item) => item.id === id);
      if (!habit) return null;
      Object.assign(habit, changes);
      // Write only this habit's change into the file, leaving the other records as they are.
      const store = JSON.parse(await readFile(file, 'utf8'));
      store.records = store.records.map((item) => (item.id === id ? { ...item, ...changes } : item));
      await writeAtomic(file, store);
      return habit;
    },
  };
}
