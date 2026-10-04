// readStore / writeStore for the notes file. writeStore replaces the file through a temp file and
// one rename (as in NO-02), so a crash never leaves half a JSON text behind.
import { randomUUID } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';

export async function readStore(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

export async function writeStore(file, store) {
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(store));
  await rename(temp, file);
}
