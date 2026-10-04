// Another valid shape: the lock wraps a named read-modify-write function.
import { randomUUID } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { withWriteLock } from './lock.js';

async function writeAtomic(file, value) {
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value));
  await rename(temp, file);
}

export function notesRepository(file) {
  async function readModifyWrite(id, changes) {
    const store = JSON.parse(await readFile(file, 'utf8'));
    const index = store.records.findIndex((note) => note.id === id);
    if (index !== -1) store.records[index] = { ...store.records[index], ...changes };
    await writeAtomic(file, store);
    return store.records[index];
  }
  return {
    async list() {
      return JSON.parse(await readFile(file, 'utf8')).records;
    },
    async updateNote(id, changes) {
      return await withWriteLock(() => readModifyWrite(id, changes));
    },
  };
}
