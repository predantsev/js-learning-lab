// Misconception: wrapping the error, but the message does not say which file failed.
import { readFile } from 'node:fs/promises';

export async function loadAll(paths) {
  return Promise.all(
    paths.map(async (file) => {
      try {
        return JSON.parse(await readFile(file, 'utf8'));
      } catch (error) {
        throw new Error('a file could not be loaded', { cause: error });
      }
    }),
  );
}
