// recoverStore(file, backupsDir, stamp): what the notes server does with its store on start.
import { copyFile, readFile, readdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { parseStore } from './contract.js';
import { isVerified } from './verify.js';

export async function recoverStore(file, backupsDir, stamp) {
  try {
    const store = parseStore(await readFile(file, 'utf8'));
    return { action: 'ok', count: store.records.length };
  } catch {
    // TODO: a missing file, or damage: quarantine, restore the newest verified backup, report
    return { action: 'ok', count: 0 };
  }
}
