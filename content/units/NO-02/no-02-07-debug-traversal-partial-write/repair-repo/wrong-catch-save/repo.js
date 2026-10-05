// Misconception: "if my code catches the error, the file on disk is still consistent".
// The save is wrapped in try/catch, but it still writes planner.json in place; the encoding stays latin1.
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

export function createRepo(dataDir) {
  const base = path.resolve(dataDir);
  const recordsFile = path.join(base, 'planner.json');

  return {
    async readNote(name) {
      const target = path.resolve(base, name);
      if (!target.startsWith(base + path.sep)) throw new Error(`"${name}" is outside the data folder`);
      return (await readFile(target)).toString('latin1');
    },

    async loadRecords() {
      const { records } = JSON.parse(await readFile(recordsFile, 'utf8'));
      return records;
    },

    async saveRecords(records) {
      try {
        await writeFile(recordsFile, JSON.stringify({ schemaVersion: 1, records }));
      } catch (error) {
        throw new Error('cannot save the tasks', { cause: error });
      }
    },
  };
}
