// Two repositories behind one interface: list({ status }) returns the tasks with that status
// ('pending' = not done, 'done' = done) as { id, title, dueDate }, ordered by dueDate (tasks without
// a date last), equal dates by id. Any other status throws.
import { readFile } from 'node:fs/promises';
export function createFileRepo(path) {
  return {
    async list({ status }) {
      return [];
    },
  };
}

export function createSqlRepo(db) {
  return {
    async list({ status }) {
      return [];
    },
  };
}

// Your note: which storage you would choose for 500 tasks of one person, and what would change that.
export const choice = { storage: '', reason: '', wouldChange: '' };
