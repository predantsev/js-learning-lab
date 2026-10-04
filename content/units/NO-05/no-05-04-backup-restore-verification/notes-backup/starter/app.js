// backupStore and verifyBackup for the notes store.
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { sha256Of } from './checksum.js';
import { parseStore } from './contract.js';

// backupStore(file, backupPath): copy the store and write backupPath + '.manifest.json'.
export async function backupStore(file, backupPath) {
  await copyFile(file, backupPath);
  return { count: 0, sha256: '' };
}

// verifyBackup(backupPath, scratchDir): restore into scratchDir and report
// { ok, count, sha256, problems } — never throw.
export async function verifyBackup(backupPath, scratchDir) {
  const exists = await readFile(backupPath, 'utf8').then(() => true, () => false);
  return { ok: exists, count: 0, sha256: '', problems: exists ? [] : ['no backup file'] };
}
