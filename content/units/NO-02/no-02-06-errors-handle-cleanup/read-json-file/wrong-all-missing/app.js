// Misconception: "if reading failed, the file must be missing" — every error becomes 'missing'.
import { open } from 'node:fs/promises';

export async function readJsonFile(path) {
  let handle = null;
  try {
    handle = await open(path);
    return { status: 'ok', value: JSON.parse(await handle.readFile('utf8')) };
  } catch {
    return { status: 'missing' };
  } finally {
    await handle?.close();
  }
}
