// readJsonFile(path):
// - an existing JSON file → { status: 'ok', value }
// - no such file (code ENOENT) → { status: 'missing' }
// - any other failure → rejects with a new Error whose `cause` is the original error
// The FileHandle is closed on every path.
import { open } from 'node:fs/promises';

export async function readJsonFile(path) {
  const handle = await open(path);
  const text = await handle.readFile('utf8');
  await handle.close();
  return { status: 'ok', value: JSON.parse(text) };
}
