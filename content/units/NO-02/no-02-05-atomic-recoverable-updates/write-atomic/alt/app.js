// Another valid solution: the 'wx' flag refuses an existing temp name, write + datasync, and the
// temp file is removed again when the write fails.
import path from 'node:path';
import { open, readdir, rename, unlink } from 'node:fs/promises';

let counter = 0;

export async function writeAtomic(target, value) {
  const temp = path.join(path.dirname(target), `.${path.basename(target)}.${process.pid}.${Date.now()}.${counter++}.tmp`);
  const handle = await open(temp, 'wx');
  try {
    await handle.write(JSON.stringify(value));
    await handle.datasync();
  } catch (error) {
    await handle.close();
    await unlink(temp).catch(() => {});
    throw error;
  }
  await handle.close();
  await rename(temp, target);
}

export async function removeStaleTemps(dir) {
  const stale = (await readdir(dir)).filter((name) => name.endsWith('.tmp'));
  await Promise.all(stale.map((name) => unlink(path.join(dir, name))));
}
