// Another valid shape: collect every verified backup first, then take the newest; copy through a temp file.
import { access, copyFile, readFile, readdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { parseStore } from './contract.js';
import { isVerified } from './verify.js';

function idsOf(text) {
  try {
    return JSON.parse(text).records.map((note) => note.id);
  } catch {
    return null;
  }
}

export async function recoverStore(file, backupsDir, stamp) {
  const exists = await access(file).then(() => true, (error) => {
    if (error.code === 'ENOENT') return false;
    throw error;
  });
  if (!exists) return { action: 'missing' };
  const text = await readFile(file, 'utf8');
  let valid = null;
  try {
    valid = parseStore(text);
  } catch {}
  if (valid) return { action: 'ok', count: valid.records.length };

  const candidates = (await readdir(backupsDir)).filter((name) => name.startsWith('notes.') && name.endsWith('.json') && !name.endsWith('.manifest.json'));
  const verified = [];
  for (const name of candidates) if (await isVerified(path.join(backupsDir, name))) verified.push(name);
  verified.sort();
  const newest = verified.at(-1);
  if (!newest) throw new Error('refusing to start: damaged store, no verified backup');

  await rename(file, `${file}.corrupt-${stamp}`);
  await copyFile(path.join(backupsDir, newest), `${file}.restoring`);
  await rename(`${file}.restoring`, file);
  const restoredIds = parseStore(await readFile(file, 'utf8')).records.map((note) => note.id);
  const damagedIds = idsOf(text);
  return {
    action: 'restored',
    quarantined: `${file}.corrupt-${stamp}`,
    restoredFrom: newest,
    count: restoredIds.length,
    notInBackup: damagedIds === null ? null : damagedIds.filter((id) => !restoredIds.includes(id)).sort(),
  };
}
