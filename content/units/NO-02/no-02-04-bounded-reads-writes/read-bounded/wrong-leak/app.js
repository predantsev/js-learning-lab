// Misconception: close() at the end of the happy path is enough. The refusal leaves the handle open.
import { open } from 'node:fs/promises';

export async function readBounded(path, maxBytes) {
  const handle = await open(path);
  const { size } = await handle.stat();
  if (size > maxBytes) throw new RangeError(`${path} is ${size} bytes; the limit is ${maxBytes}`);
  const bytes = await handle.readFile();
  await handle.close();
  return bytes;
}
