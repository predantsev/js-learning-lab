// Misconception: rename is all that matters; the temp file's FileHandle is never closed.
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { open, readdir, rename, rm } from 'node:fs/promises';

export async function writeAtomic(target, value) {
  const temp = `${target}.${randomUUID()}.tmp`;
  const handle = await open(temp, 'w');
  await handle.writeFile(JSON.stringify(value));
  await handle.sync();
  await rename(temp, target);
}

export async function removeStaleTemps(dir) {
  for (const name of await readdir(dir)) {
    if (name.endsWith('.tmp')) await rm(path.join(dir, name), { force: true });
  }
}
