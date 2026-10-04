// Misconception: "writeFile either writes everything or nothing" — so it writes straight into the target.
import path from 'node:path';
import { open, readdir, rm } from 'node:fs/promises';

export async function writeAtomic(target, value) {
  const handle = await open(target, 'w');
  try {
    await handle.writeFile(JSON.stringify(value));
    await handle.sync();
  } finally {
    await handle.close();
  }
}

export async function removeStaleTemps(dir) {
  for (const name of await readdir(dir)) {
    if (name.endsWith('.tmp')) await rm(path.join(dir, name), { force: true });
  }
}
