// loadAll(paths): read independent JSON files at the same time and parse each one.
// Resolves with the parsed values in the order of `paths`; when a file fails, rejects with an
// Error that names that file and keeps the original error as `cause`.
import path from 'node:path';
import { readFile } from 'node:fs/promises';

export async function loadAll(paths) {
  // map starts every read at once; Promise.all keeps the results in the order of `paths`.
  return Promise.all(
    paths.map(async (file) => {
      try {
        return JSON.parse(await readFile(file, 'utf8'));
      } catch (error) {
        throw new Error(`cannot load ${path.basename(file)}: ${error.message}`, { cause: error });
      }
    }),
  );
}
