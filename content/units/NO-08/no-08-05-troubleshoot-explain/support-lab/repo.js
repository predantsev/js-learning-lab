// The expense repository over one JSON file { schemaVersion, records }. Every read of the file is
// counted in `reads`, so a log line can say how many reads one request needed.
import { randomUUID } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';

export function openRepository(file) {
  let tail = Promise.resolve();
  const stats = { reads: 0 };
  const load = async () => {
    stats.reads += 1;
    return JSON.parse(await readFile(file, 'utf8')).records;
  };
  const repo = {
    stats,
    async get(id) {
      return (await load()).find((expense) => expense.id === id) ?? null;
    },
    // Every expense, newest first.
    async list() {
      const ids = (await load()).map((expense) => expense.id);
      const expenses = [];
      for (const id of ids) expenses.push(await repo.get(id));
      return expenses.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    },
    add(expense) {
      const done = tail.then(async () => {
        const records = await load();
        records.push(expense);
        const temp = `${file}.${randomUUID()}.tmp`;
        await writeFile(temp, JSON.stringify({ schemaVersion: 1, records }));
        await rename(temp, file);
        return expense;
      });
      tail = done.catch(() => {});
      return done;
    },
  };
  return repo;
}
