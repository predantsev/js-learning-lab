// recoverStore(file, backupsDir, stamp): what the notes server does with its store on start.
// Mistake: it quarantines the store before it knows that a verified backup exists.
import { copyFile, readFile, readdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { parseStore } from './contract.js';
import { isVerified } from './verify.js';

export async function recoverStore(file, backupsDir, stamp) {
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return { action: 'missing' };
    throw error;
  }
  try {
    return { action: 'ok', count: parseStore(text).records.length };
  } catch {
    // damaged: fall through to recovery
  }

  const quarantined = `${file}.corrupt-${stamp}`;
  await rename(file, quarantined);
  const names = (await readdir(backupsDir)).filter((name) => /^notes\..+\.json$/.test(name)).sort().reverse();
  let chosen = null;
  for (const name of names) {
    if (await isVerified(path.join(backupsDir, name))) {
      chosen = name;
      break;
    }
  }
  if (chosen === null) throw new Error(`${file} is damaged and there is no verified backup: refusing to start`);

  await copyFile(path.join(backupsDir, chosen), file);
  const restored = parseStore(await readFile(file, 'utf8'));

  let notInBackup = null;
  try {
    const known = new Set(restored.records.map((note) => note.id));
    notInBackup = JSON.parse(text).records.map((note) => note.id).filter((id) => !known.has(id)).sort();
  } catch {
    notInBackup = null; // the damaged text is not readable JSON: what was lost is unknown
  }
  return { action: 'restored', quarantined, restoredFrom: chosen, count: restored.records.length, notInBackup };
}
