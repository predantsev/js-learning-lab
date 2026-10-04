// isVerified(backupPath): true when the backup matches its manifest (sha256 and count) and passes
// the contract; false otherwise — it never throws.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parseStore } from './contract.js';

export async function isVerified(backupPath) {
  try {
    const text = await readFile(backupPath, 'utf8');
    const manifest = JSON.parse(await readFile(`${backupPath}.manifest.json`, 'utf8'));
    const sha256 = createHash('sha256').update(text).digest('hex');
    return sha256 === manifest.sha256 && parseStore(text).records.length === manifest.count;
  } catch {
    return false;
  }
}
