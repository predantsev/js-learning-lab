// Reading list store, version 1 → 2:
// Mistake: it still calls trim() on pages that an older client stored as a number.
//   v1 book: { id, title, pages: "312", finished: "yes" | "no" }
//   v2 book: { id, title, pages: 312, finished: true | false }
import { copyFile, readFile, rename, writeFile } from 'node:fs/promises';
import { isValidV2, isVerified } from './check.js';

// Turns one v1 book into its v2 shape.
export function migrateBook(book) {
  const pages = Number(book.pages.trim());
  if (!Number.isInteger(pages) || pages < 0) throw new Error(`${book.id}: pages ${JSON.stringify(book.pages)} is not a whole number`);
  return { ...book, pages, finished: book.finished === 'yes' || book.finished === true };
}

async function writeAtomic(file, text) {
  await writeFile(`${file}.tmp`, text);
  await rename(`${file}.tmp`, file);
}

// Migrates the store in `file` to version 2. Resolves with 'migrated' or 'already'.
export async function upgrade(file) {
  const store = JSON.parse(await readFile(file, 'utf8'));
  if (store.schemaVersion === 2) return 'already';
  const records = store.records.map(migrateBook); // all in memory: a throw here changes no file
  await writeAtomic(file, JSON.stringify({ schemaVersion: 2, records })); // data and version together
  return 'migrated';
}

// Brings a live store that a failed migration left behind back to a correct version 2.
export async function recoverAndUpgrade(file, backupPath) {
  const live = JSON.parse(await readFile(file, 'utf8'));
  if (isValidV2(live)) return 'ok';
  if (live.schemaVersion === 1) return upgrade(file);
  if (!(await isVerified(backupPath))) throw new Error(`${file} is half-migrated and the backup is not verified`);
  await rename(file, `${file}.half-migrated`); // keep the evidence
  await copyFile(backupPath, `${file}.tmp`);
  await rename(`${file}.tmp`, file);
  await upgrade(file);
  return 'recovered';
}
