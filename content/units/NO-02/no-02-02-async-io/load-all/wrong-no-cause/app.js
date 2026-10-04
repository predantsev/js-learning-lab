// Misconception: the message names the file, but the original error (and its code) is thrown away.
import path from 'node:path';
import { readFile } from 'node:fs/promises';

export async function loadAll(paths) {
  return Promise.all(
    paths.map(async (file) => {
      try {
        return JSON.parse(await readFile(file, 'utf8'));
      } catch (error) {
        throw new Error(`cannot load ${path.basename(file)}: ${error.message}`);
      }
    }),
  );
}
