// The expense repository: a JSON file with an in-memory cache in front of it.
// Every 20th read finds the cache stale (as if another process had changed the file) and reads
// and parses the whole file again. That cache miss is the slow tail this lesson looks for.
import { readFile, writeFile } from 'node:fs/promises';

export async function createRepository(file, expenses) {
  await writeFile(file, JSON.stringify(expenses));
  let cache = expenses;
  let reads = 0;
  return {
    async list(category) {
      reads += 1;
      if (reads % 20 === 0) cache = null;
      if (cache === null) cache = JSON.parse(await readFile(file, 'utf8'));
      return cache.filter((expense) => expense.category === category);
    },
  };
}
