// Misconception: ">= maxBytes" — a file of exactly the limit is refused too.
import { open, stat } from 'node:fs/promises';

export async function readBounded(path, maxBytes) {
  const { size } = await stat(path);
  if (size >= maxBytes) throw new RangeError(`${path} is ${size} bytes; the limit is ${maxBytes}`);
  const handle = await open(path);
  try {
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}
