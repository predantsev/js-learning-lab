// Another valid solution: one try block, the handle closed in finally only when it was opened.
import { open } from 'node:fs/promises';

export async function readJsonFile(path) {
  let handle = null;
  try {
    handle = await open(path);
    return { status: 'ok', value: JSON.parse(await handle.readFile('utf8')) };
  } catch (error) {
    if (handle === null && error.code === 'ENOENT') return { status: 'missing' };
    throw new Error(`${path}: ${error.code ?? error.name}`, { cause: error });
  } finally {
    await handle?.close();
  }
}
