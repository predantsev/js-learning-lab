// Another valid solution: open first and ask the handle for the size, then let it read the file.
import { open } from 'node:fs/promises';

export async function readBounded(path, maxBytes) {
  const handle = await open(path);
  try {
    const { size } = await handle.stat();
    if (size > maxBytes) throw new RangeError(`${path} is ${size} bytes; the limit is ${maxBytes}`);
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}
