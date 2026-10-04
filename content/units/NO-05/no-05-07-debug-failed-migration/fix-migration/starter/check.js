// isValidV2(store): every record has the version 2 shape. isVerified(backupPath): the backup
// matches its manifest (sha256 and count) and holds a version 1 store. Neither throws.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export function isValidV2(store) {
  return store?.schemaVersion === 2 && Array.isArray(store.records) && store.records.every((book) =>
    typeof book.id === 'string' && typeof book.title === 'string'
    && Number.isInteger(book.pages) && book.pages >= 0 && typeof book.finished === 'boolean');
}

export async function isVerified(backupPath) {
  try {
    const text = await readFile(backupPath, 'utf8');
    const manifest = JSON.parse(await readFile(`${backupPath}.manifest.json`, 'utf8'));
    const store = JSON.parse(text);
    return createHash('sha256').update(text).digest('hex') === manifest.sha256
      && store.schemaVersion === 1 && store.records.length === manifest.count;
  } catch {
    return false;
  }
}
