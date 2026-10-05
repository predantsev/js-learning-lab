// Two repositories behind one interface: list({ status }) returns the tasks with that status
// ('pending' = not done, 'done' = done) as { id, title, dueDate }, ordered by dueDate (tasks without
// a date last), equal dates by id. Any other status throws.
import { readFile } from 'node:fs/promises';

const byDate = (a, b) =>
  (a.dueDate === null) - (b.dueDate === null) || (a.dueDate ?? '').localeCompare(b.dueDate ?? '', 'en') || a.id.localeCompare(b.id, 'en');

export function createFileRepo(path) {
  return {
    async list({ status }) {
      const wanted = { pending: false, done: true }[status];
      if (wanted === undefined) throw new RangeError(`status must be pending or done, got ${status}`);
      const { records } = JSON.parse(await readFile(path, 'utf8'));
      return records.filter((t) => t.done === wanted).sort(byDate).map((t) => ({ id: t.id, title: t.title, dueDate: t.dueDate }));
    },
  };
}

export function createSqlRepo(db) {
  return {
    async list({ status }) {
      if (status !== 'pending' && status !== 'done') throw new RangeError(`status must be pending or done, got ${status}`);
      const sql = 'SELECT id, title, dueDate FROM tasks WHERE done = :done ORDER BY dueDate IS NULL, dueDate, id';
      return db.prepare(sql).all({ done: status === 'done' ? 1 : 0 }).map((row) => ({ ...row }));
    },
  };
}

export const choice = {
  storage: 'sqlite',
  reason: 'node:sqlite is built into Node, and filtering and sorting move into one query with an index later.',
  wouldChange: 'If setup had to stay as simple as one JSON file a person can read and back up, I would keep the file.',
};
