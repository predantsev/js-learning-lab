// readJsonFile(path):
// - an existing JSON file → { status: 'ok', value }
// - no such file (code ENOENT) → { status: 'missing' }
// - any other failure → rejects with a new Error whose `cause` is the original error
// The FileHandle is closed on every path.
import { open } from 'node:fs/promises';

export async function readJsonFile(path) {
  let handle;
  try {
    handle = await open(path);
  } catch (error) {
    if (error.code === 'ENOENT') return { status: 'missing' }; // an expected, recoverable case
    throw new Error(`cannot open ${path}`, { cause: error });
  }
  try {
    const text = await handle.readFile('utf8');
    return { status: 'ok', value: JSON.parse(text) };
  } catch (error) {
    throw new Error(`cannot read ${path}`, { cause: error });
  } finally {
    await handle.close(); // after return and after throw alike
  }
}
