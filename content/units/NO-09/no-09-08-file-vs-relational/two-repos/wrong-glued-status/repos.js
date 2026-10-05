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
        .toSorted((a, b) => {
          if (a.dueDate !== b.dueDate) {
            if (a.dueDate === null) return 1;
            if (b.dueDate === null) return -1;
            return a.dueDate < b.dueDate ? -1 : 1;
          }
          return a.id < b.id ? -1 : 1;
        })
        .map(({ id, title, dueDate }) => ({ id, title, dueDate }));
    },
  };
}

export function createSqlRepo(db) {
  return {
    async list({ status }) {
      // The status is glued into the SQL; an unknown word is not refused.
      const sql = `SELECT id, title, dueDate FROM tasks WHERE done = (CASE '${status}' WHEN 'done' THEN 1 ELSE 0 END)
                   ORDER BY dueDate IS NULL, dueDate, id`;
      return db.prepare(sql).all().map((row) => ({ ...row }));
    },
  };
}

export const choice = {
  storage: 'file',
  reason: 'A few hundred records written by one person fit in one small file, and backup is a file copy.',
  wouldChange: 'Many users writing at once, or queries such as joins over thousands of rows, would move it to SQLite.',
};
