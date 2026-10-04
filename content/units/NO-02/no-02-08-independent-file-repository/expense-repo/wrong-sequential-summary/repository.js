// Misconception: two independent files are read one after the other.
// createFileRepository(dataDir, { maxBytes }): expenses in <dataDir>/expenses.json as
// { schemaVersion: 1, records }, category labels in <dataDir>/categories.json.
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { open, readdir, rename, rm, stat } from 'node:fs/promises';

export function createFileRepository(dataDir, { maxBytes }) {
  const recordsFile = path.join(dataDir, 'expenses.json');
  const categoriesFile = path.join(dataDir, 'categories.json');

  // Bounded read of a JSON file; `missing` is returned when the file does not exist.
  async function readJson(file, missing) {
    let size;
    try {
      ({ size } = await stat(file));
    } catch (error) {
      if (error.code === 'ENOENT') return missing;
      throw new Error(`cannot read ${path.basename(file)}`, { cause: error });
    }
    if (size > maxBytes) throw new RangeError(`${path.basename(file)} is ${size} bytes; the limit is ${maxBytes}`);
    const handle = await open(file);
    try {
      return JSON.parse(await handle.readFile('utf8'));
    } catch (error) {
      throw new Error(`cannot read ${path.basename(file)}`, { cause: error });
    } finally {
      await handle.close();
    }
  }

  async function list() {
    const { records } = await readJson(recordsFile, { schemaVersion: 1, records: [] });
    return records;
  }

  async function write(records) {
    const text = JSON.stringify({ schemaVersion: 1, records });
    if (Buffer.byteLength(text) > maxBytes) throw new RangeError(`the records would take more than ${maxBytes} bytes`);
    const temp = `${recordsFile}.${randomUUID()}.tmp`;
    const handle = await open(temp, 'w');
    try {
      await handle.writeFile(text);
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temp, recordsFile);
  }

  return {
    list,

    async get(id) {
      return (await list()).find((record) => record.id === id) ?? null;
    },

    async save(record) {
      const records = (await list()).filter((r) => r.id !== record.id);
      records.push(record);
      await write(records);
    },

    async remove(id) {
      const records = await list();
      const left = records.filter((r) => r.id !== id);
      if (left.length === records.length) return false;
      await write(left);
      return true;
    },

    // Totals per category in minor units, labelled from categories.json. The two files are
    // independent, so they are read at the same time.
    async summary() {
      const records = await list();
      const categories = await readJson(categoriesFile, []);
      const totals = {};
      for (const { id, label } of categories) totals[id] = { label, totalMinor: 0 };
      for (const record of records) {
        totals[record.category] ??= { label: record.category, totalMinor: 0 };
        totals[record.category].totalMinor += record.amountMinor;
      }
      return totals;
    },

    // On start: remove what a crash left behind.
    async recover() {
      for (const name of await readdir(dataDir)) {
        if (name.endsWith('.tmp')) await rm(path.join(dataDir, name), { force: true });
      }
    },
  };
}
