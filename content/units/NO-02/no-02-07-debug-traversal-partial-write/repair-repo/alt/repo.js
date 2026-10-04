// Another valid repair: a strict TextDecoder, a startsWith check with the separator, and a temp
// file written through a FileHandle with sync() before the rename.
import path from 'node:path';
import { open, readFile, rename } from 'node:fs/promises';

let saves = 0;

export function createRepo(dataDir) {
  const base = path.resolve(dataDir);
  const recordsFile = path.join(base, 'planner.json');

  return {
    async readNote(name) {
      const target = path.resolve(base, name);
      if (!target.startsWith(base + path.sep)) throw new Error(`"${name}" is outside the data folder`);
      return new TextDecoder('utf-8', { fatal: true }).decode(await readFile(target));
    },

    async loadRecords() {
      const { records } = JSON.parse(await readFile(recordsFile, 'utf8'));
      return records;
    },

    async saveRecords(records) {
      const temp = `${recordsFile}.${process.pid}.${saves++}.tmp`;
      const handle = await open(temp, 'w');
      try {
        await handle.writeFile(JSON.stringify({ schemaVersion: 1, records }));
        await handle.sync();
      } finally {
        await handle.close();
      }
      await rename(temp, recordsFile);
    },
  };
}
