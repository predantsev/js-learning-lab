// Misconception: close() after the happy path is enough. When JSON.parse throws, the handle stays open.
import { open } from 'node:fs/promises';

export async function readJsonFile(path) {
  let handle;
  try {
    handle = await open(path);
  } catch (error) {
    if (error.code === 'ENOENT') return { status: 'missing' };
    throw new Error(`cannot open ${path}`, { cause: error });
  }
  try {
    const value = JSON.parse(await handle.readFile('utf8'));
    await handle.close();
    return { status: 'ok', value };
  } catch (error) {
    throw new Error(`cannot read ${path}`, { cause: error });
  }
}
