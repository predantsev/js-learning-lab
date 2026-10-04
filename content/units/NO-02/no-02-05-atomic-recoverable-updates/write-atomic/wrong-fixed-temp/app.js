// Misconception: one fixed temp name is enough. Two saves at once share it and trip over each other.
import path from 'node:path';
import { open, readdir, rename, rm } from 'node:fs/promises';

export async function writeAtomic(target, value) {
  const temp = `${target}.tmp`;
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
    if (name.endsWith('.tmp')) await rm(path.join(dir, name), { force: true });
  }
}
