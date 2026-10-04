// Another valid solution: the size comes from the open handle, a chunk loop reads the file, the
// temp file is created with 'wx' and removed again when the write fails.
import path from 'node:path';
import { open, readdir, rename, unlink } from 'node:fs/promises';

let saves = 0;

export function createFileRepository(dataDir, { maxBytes }) {
  const recordsFile = path.join(dataDir, 'expenses.json');
  const categoriesFile = path.join(dataDir, 'categories.json');

  async function readJson(file, missing) {
    let handle;
    try {
      handle = await open(file);
    } catch (error) {
      if (error.code === 'ENOENT') return missing;
      throw new Error(`${file}: ${error.code}`, { cause: error });
    }
    try {
      const { size } = await handle.stat();
      if (size > maxBytes) throw new RangeError(`${file} is larger than ${maxBytes} bytes`);
      const chunks = [];
      const chunk = Buffer.alloc(16 * 1024);
      let bytesRead;
      while ((bytesRead = (await handle.read(chunk, 0, chunk.length, null)).bytesRead) > 0) {
        chunks.push(Buffer.from(chunk.subarray(0, bytesRead)));
      }
      const text = Buffer.concat(chunks).toString('utf8');
      try {
        return JSON.parse(text);
      } catch (error) {
        throw new Error(`${file} is not valid JSON`, { cause: error });
      }
    } finally {
      await handle.close();
    }
  }

  const list = async () => (await readJson(recordsFile, { schemaVersion: 1, records: [] })).records;

  async function write(records) {
    const bytes = Buffer.from(JSON.stringify({ schemaVersion: 1, records }));
    if (bytes.length > maxBytes) throw new RangeError(`${bytes.length} bytes is over the limit of ${maxBytes}`);
    const temp = path.join(dataDir, `.expenses.${process.pid}.${saves++}.tmp`);
    const handle = await open(temp, 'wx');
    try {
      await handle.write(bytes);
      await handle.datasync();
    } catch (error) {
      await handle.close();
      await unlink(temp).catch(() => {});
      throw error;
    }
    await handle.close();
    await rename(temp, recordsFile);
  }

  return {
    list,
    get: async (id) => (await list()).find((r) => r.id === id) ?? null,
    save: async (record) => {
      const records = await list();
      const i = records.findIndex((r) => r.id === record.id);
      if (i === -1) records.push(record);
      else records[i] = record;
      await write(records);
    },
    remove: async (id) => {
      const records = await list();
      const i = records.findIndex((r) => r.id === id);
      if (i === -1) return false;
      records.splice(i, 1);
      await write(records);
      return true;
    },
    summary: async () => {
      const [records, categories] = await Promise.all([list(), readJson(categoriesFile, [])]);
      const labels = new Map(categories.map((c) => [c.id, c.label]));
      const totals = {};
      for (const c of categories) totals[c.id] = { label: c.label, totalMinor: 0 };
      for (const r of records) {
        const entry = (totals[r.category] ??= { label: labels.get(r.category) ?? r.category, totalMinor: 0 });
        entry.totalMinor += r.amountMinor;
      }
      return totals;
    },
    recover: async () => {
      const names = await readdir(dataDir);
      await Promise.all(names.filter((n) => n.endsWith('.tmp')).map((n) => unlink(path.join(dataDir, n))));
    },
  };
}
