// Misconception: "once writeFile resolved, the bytes are on the disk" — the rename may then point
// at data that a power cut can still lose.
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { readdir, rename, rm, writeFile } from 'node:fs/promises';

export async function writeAtomic(target, value) {
  const temp = `${target}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value));
  await rename(temp, target);
}

export async function removeStaleTemps(dir) {
  for (const name of await readdir(dir)) {
    if (name.endsWith('.tmp')) await rm(path.join(dir, name), { force: true });
  }
}
