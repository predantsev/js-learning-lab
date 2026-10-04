// Misconception: correct results, but each read waits for the previous one to finish.
import path from 'node:path';
import { readFile } from 'node:fs/promises';

export async function loadAll(paths) {
  const results = [];
  for (const file of paths) {
    try {
      results.push(JSON.parse(await readFile(file, 'utf8')));
    } catch (error) {
      throw new Error(`cannot load ${path.basename(file)}: ${error.message}`, { cause: error });
    }
  }
  return results;
}
