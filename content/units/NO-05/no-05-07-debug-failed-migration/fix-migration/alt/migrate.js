// Another valid shape: parseInt with a strict check, a copy file as the migration's workspace.
import { copyFile, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { isValidV2, isVerified } from './check.js';

export function migrateBook({ id, title, pages, finished }) {
  const text = typeof pages === 'number' ? String(pages) : pages.trim();
  if (!/^\d+$/.test(text)) throw new RangeError(`book ${id} has pages "${pages}"`);
  return { id, title, pages: Number.parseInt(text, 10), finished: finished === 'yes' };
}

export async function upgrade(file) {
  const store = JSON.parse(await readFile(file, 'utf8'));
  if (store.schemaVersion >= 2) return 'already';
  const copy = `${file}.migrating`;
  try {
    await writeFile(copy, JSON.stringify({ schemaVersion: 2, records: store.records.map(migrateBook) }));
    await rename(copy, file);
  } finally {
    await rm(copy, { force: true });
  }
  return 'migrated';
}

export async function recoverAndUpgrade(file, backupPath) {
  const live = JSON.parse(await readFile(file, 'utf8'));
  if (live.schemaVersion === 2 && isValidV2(live)) return 'ok';
  if (live.schemaVersion === 1) return upgrade(file);
  const verified = await isVerified(backupPath);
  if (!verified) throw new Error('refusing to recover: no verified backup');
  await copyFile(file, `${file}.half-migrated`, 1); // COPYFILE_EXCL: never overwrite older evidence
  await copyFile(backupPath, file);
  await upgrade(file);
  return 'recovered';
}
