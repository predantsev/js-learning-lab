// A repair attempt that fixes the path and the save but keeps decoding the notes as latin1
// ("the text came out, so the decoding must be fine").
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { readFile, rename, writeFile } from 'node:fs/promises';

function resolveInside(baseDir, name) {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, name);
  const relative = path.relative(base, target);
  if (relative === '' || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`"${name}" is outside the data folder`);
  }
  return target;
}

export function createRepo(dataDir) {
  const recordsFile = path.join(dataDir, 'planner.json');

  return {
    // A note by its file name, for example "t-01.txt" or "archive/t-04.txt".
    async readNote(name) {
      // 1. Check the resolved path, not the beginning of the name.
      const bytes = await readFile(resolveInside(dataDir, name));
      return bytes.toString('latin1');
    },

    async loadRecords() {
      const { records } = JSON.parse(await readFile(recordsFile, 'utf8'));
      return records;
    },

    async saveRecords(records) {
      // 3. Write a temp file next to planner.json, then replace it in one rename.
      const temp = `${recordsFile}.${randomUUID()}.tmp`;
      await writeFile(temp, JSON.stringify({ schemaVersion: 1, records }));
      await rename(temp, recordsFile);
    },
  };
}
