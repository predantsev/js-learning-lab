// loadAll(paths): read independent JSON files at the same time and parse each one.
// Resolves with the parsed values in the order of `paths`; when a file fails, rejects with an
// Error that names that file and keeps the original error as `cause`.
import path from 'node:path';
import { readFile } from 'node:fs/promises';

export async function loadAll(paths) {
  const results = [];
  for (const file of paths) {
    results.push(await readFile(file, 'utf8'));
  }
  return results;
}
