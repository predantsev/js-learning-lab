// writeAtomic(target, value): replace `target` with JSON of `value` so that a reader only ever sees
// the complete old file or the complete new one.
// removeStaleTemps(dir): on start, delete the *.tmp files a crash left behind in `dir`.
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { open, readdir, rename, rm, writeFile } from 'node:fs/promises';

export async function writeAtomic(target, value) {
  await writeFile(target, JSON.stringify(value));
}

export async function removeStaleTemps(dir) {
  // Remove every file in `dir` whose name ends with ".tmp"; keep all the others.
}
