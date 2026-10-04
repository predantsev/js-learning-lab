// Misconception: any Error will do. Callers cannot tell "too large" from other failures.
import { open, stat } from 'node:fs/promises';

export async function readBounded(path, maxBytes) {
  const { size } = await stat(path);
  if (size > maxBytes) throw new Error(`${path} is too large`);
  const handle = await open(path);
  try {
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}
