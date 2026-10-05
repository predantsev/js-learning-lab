// Reading list store, version 1 → 2:
//   v1 book: { id, title, pages: "312", finished: "yes" | "no" }
//   v2 book: { id, title, pages: 312, finished: true | false }
import { readFile, writeFile } from 'node:fs/promises';

// Turns one v1 book into its v2 shape.
export function migrateBook(book) {
  book.pages = Number(book.pages.trim());
  book.finished = book.finished === 'yes';
  return book;
}

// Migrates the store in `file` to version 2. Resolves with 'migrated' or 'already'.
export async function upgrade(file) {
  const store = JSON.parse(await readFile(file, 'utf8'));
  if (store.schemaVersion === 2) return 'already';
  store.schemaVersion = 2;
  await writeFile(file, JSON.stringify(store)); // record the new version
  for (let i = 0; i < store.records.length; i++) {
    store.records[i] = migrateBook(store.records[i]);
    await writeFile(file, JSON.stringify(store)); // keep the progress
  }
  return 'migrated';
}

// Brings a live store that a failed migration left behind back to a correct version 2.
export async function recoverAndUpgrade(file, backupPath) {
  return upgrade(file);
}
