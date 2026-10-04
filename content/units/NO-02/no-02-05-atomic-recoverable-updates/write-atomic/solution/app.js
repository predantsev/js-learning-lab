// writeAtomic(target, value): replace `target` with JSON of `value` so that a reader only ever sees
// the complete old file or the complete new one.
// removeStaleTemps(dir): on start, delete the *.tmp files a crash left behind in `dir`.
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { open, readdir, rename, rm } from 'node:fs/promises';

export async function writeAtomic(target, value) {
  // Same folder (rename replaces atomically only within one file system), unique name, ends in .tmp.
  const temp = `${target}.${randomUUID()}.tmp`;
  const handle = await open(temp, 'w');
  try {
    await handle.writeFile(JSON.stringify(value));
    await handle.sync(); // the bytes are on the disk before the new name points at them
  } finally {
    await handle.close();
  }
  await rename(temp, target);
}

export async function removeStaleTemps(dir) {
  for (const name of await readdir(dir)) {
    if (name.endsWith('.tmp')) await rm(path.join(dir, name), { force: true });
  }
}
