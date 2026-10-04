// Misconception: "clean the data folder on start" — the real data file is deleted with the temp files.
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { open, readdir, rename, rm } from 'node:fs/promises';

export async function writeAtomic(target, value) {
  const temp = `${target}.${randomUUID()}.tmp`;
  const handle = await open(temp, 'w');
  try {
    await handle.writeFile(JSON.stringify(value));
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temp, target);
}

export async function removeStaleTemps(dir) {
  for (const name of await readdir(dir)) {
    await rm(path.join(dir, name), { force: true });
  }
}
