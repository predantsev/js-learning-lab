// Misconception: "the size gate is all that matters" — the file is then read with readFile(path),
// so there is no FileHandle of your own to read through and to close.
import { readFile, stat } from 'node:fs/promises';

export async function readBounded(path, maxBytes) {
  const { size } = await stat(path);
  if (size > maxBytes) throw new RangeError(`${path} is ${size} bytes; the limit is ${maxBytes}`);
  return readFile(path);
}
