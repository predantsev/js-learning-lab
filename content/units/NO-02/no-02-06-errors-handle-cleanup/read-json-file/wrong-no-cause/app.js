// Misconception: a new message is enough — the original error and its code are thrown away.
import { open } from 'node:fs/promises';

export async function readJsonFile(path) {
  let handle = null;
  try {
    handle = await open(path);
    return { status: 'ok', value: JSON.parse(await handle.readFile('utf8')) };
  } catch (error) {
    if (error.code === 'ENOENT') return { status: 'missing' };
    throw new Error(`cannot read ${path}`);
  } finally {
    await handle?.close();
  }
}
