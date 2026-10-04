// Misconception: "the limit can be checked afterwards" — the whole file is already in memory by then.
import { open } from 'node:fs/promises';

export async function readBounded(path, maxBytes) {
  const handle = await open(path);
  try {
    const bytes = await handle.readFile();
    if (bytes.length > maxBytes) throw new RangeError(`${path} is ${bytes.length} bytes; the limit is ${maxBytes}`);
    return bytes;
  } finally {
    await handle.close();
  }
}
