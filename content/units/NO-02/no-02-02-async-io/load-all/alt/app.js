// Another valid solution: start every read, wait for all with allSettled, then parse in order.
import path from 'node:path';
import { readFile } from 'node:fs/promises';

export async function loadAll(paths) {
  const settled = await Promise.allSettled(paths.map((file) => readFile(file, 'utf8')));
  return settled.map((outcome, i) => {
    const name = path.basename(paths[i]);
    if (outcome.status === 'rejected') {
      throw new Error(`cannot read ${name}`, { cause: outcome.reason });
    }
    try {
      return JSON.parse(outcome.value);
    } catch (error) {
      throw new Error(`${name} is not valid JSON`, { cause: error });
    }
  });
}
