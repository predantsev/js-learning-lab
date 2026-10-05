// Two repositories behind one interface: list({ status }) returns the tasks with that status
// ('pending' = not done, 'done' = done) as { id, title, dueDate }, ordered by dueDate (tasks without
// a date last), equal dates by id. Any other status throws.
import { readFile } from 'node:fs/promises';

export function createFileRepo(path) {
  return {
    async list({ status }) {
      if (status !== 'pending' && status !== 'done') throw new Error(`unknown status: ${status}`);
      const { records } = JSON.parse(await readFile(path, 'utf8'));
      return records
        .filter((task) => task.done === (status === 'done'))
        // Equal dates are left in the file's order: nothing compares the ids.
        .toSorted((a, b) => {
          if (a.dueDate === b.dueDate) return 0;
          if (a.dueDate === null) return 1;
          if (b.dueDate === null) return -1;
          return a.dueDate < b.dueDate ? -1 : 1;
        })
        .map(({ id, title, dueDate }) => ({ id, title, dueDate }));
    },
  };
}

const DONE = { pending: 0, done: 1 };

export function createSqlRepo(db) {
  const query = db.prepare(
    'SELECT id, title, dueDate FROM tasks WHERE done = ? ORDER BY dueDate IS NULL, dueDate', // no id for equal dates
  );
  return {
    async list({ status }) {
      if (!Object.hasOwn(DONE, status)) throw new Error(`unknown status: ${status}`);
      return query.all(DONE[status]).map((row) => ({ ...row }));
    },
  };
}

export const choice = {
  storage: 'file',
  reason: 'A few hundred records written by one person fit in one small file, and backup is a file copy.',
  wouldChange: 'Many users writing at once, or queries such as joins over thousands of rows, would move it to SQLite.',
};
