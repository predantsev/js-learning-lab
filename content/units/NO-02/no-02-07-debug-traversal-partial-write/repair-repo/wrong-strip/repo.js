// A repair attempt with the "clean the name" misconception: '../' is removed, but an absolute name
// and the '....//' trick still escape. The other two defects are fixed.
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { readFile, rename, writeFile } from 'node:fs/promises';

export function createRepo(dataDir) {
  const recordsFile = path.join(dataDir, 'planner.json');

  return {
    async readNote(name) {
      const cleaned = name.replaceAll('../', '');
      const bytes = await readFile(path.resolve(dataDir, cleaned));
      return bytes.toString('utf8');
    },

    async loadRecords() {
      const { records } = JSON.parse(await readFile(recordsFile, 'utf8'));
      return records;
    },

    async saveRecords(records) {
      const temp = `${recordsFile}.${randomUUID()}.tmp`;
      await writeFile(temp, JSON.stringify({ schemaVersion: 1, records }));
      await rename(temp, recordsFile);
    },
  };
}
