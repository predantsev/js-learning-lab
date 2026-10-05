// The notes repository: a JSON file { schemaVersion, records }, replaced atomically on every save.
import { randomUUID } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { withWriteLock } from './lock.js';

async function writeAtomic(file, value) {
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value));
  await rename(temp, file);
}

export function notesRepository(file) {
  return {
    async list() {
      return JSON.parse(await readFile(file, 'utf8')).records;
    },
    // updateNote(id, changes): merge `changes` into the note with this id and save the store.
    async updateNote(id, changes) {
      const store = JSON.parse(await readFile(file, 'utf8'));
      store.records = store.records.map((note) => (note.id === id ? { ...note, ...changes } : note));
      await writeAtomic(file, store);
      return store.records.find((note) => note.id === id);
    },
  };
}
