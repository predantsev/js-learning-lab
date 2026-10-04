// Misconception: the reads run at once, but the text is returned as it is, never parsed as JSON.
import path from 'node:path';
import { readFile } from 'node:fs/promises';

export async function loadAll(paths) {
  return Promise.all(
    paths.map(async (file) => {
      try {
        return await readFile(file, 'utf8');
      } catch (error) {
        throw new Error(`cannot load ${path.basename(file)}: ${error.message}`, { cause: error });
      }
    }),
  );
}
