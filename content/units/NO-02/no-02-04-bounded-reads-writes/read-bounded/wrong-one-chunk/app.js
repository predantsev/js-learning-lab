// Misconception: one read() call returns the whole file. It returns at most one chunk.
import { open, stat } from 'node:fs/promises';

const CHUNK_SIZE = 64 * 1024;

export async function readBounded(path, maxBytes) {
  const { size } = await stat(path);
  if (size > maxBytes) throw new RangeError(`${path} is ${size} bytes; the limit is ${maxBytes}`);
  const handle = await open(path);
  try {
    const { bytesRead, buffer } = await handle.read(Buffer.alloc(CHUNK_SIZE), 0, CHUNK_SIZE, null);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}
