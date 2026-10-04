// A repair attempt that fixes the path and the encoding but keeps writing planner.json in place.
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

export function createRepo(dataDir) {
  const base = path.resolve(dataDir);
  const recordsFile = path.join(base, 'planner.json');

  return {
    async readNote(name) {
      const target = path.resolve(base, name);
      if (!target.startsWith(base + path.sep)) throw new Error(`"${name}" is outside the data folder`);
      return (await readFile(target)).toString('utf8');
    },

    async loadRecords() {
      const { records } = JSON.parse(await readFile(recordsFile, 'utf8'));
      return records;
    },

    async saveRecords(records) {
      await writeFile(recordsFile, JSON.stringify({ schemaVersion: 1, records }));
    },
  };
}
