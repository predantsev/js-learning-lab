// The planner's file repository: notes as text files, tasks in planner.json.
// It looks fine and works on the happy path. It has three defects.
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

export function createRepo(dataDir) {
  const recordsFile = path.join(dataDir, 'planner.json');

  return {
    // A note by its file name, for example "t-01.txt" or "archive/t-04.txt".
    async readNote(name) {
      if (name.startsWith('..')) throw new Error(`"${name}" is outside the data folder`);
      const bytes = await readFile(path.join(dataDir, name));
      return bytes.toString('latin1');
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
