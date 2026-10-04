// The planner's migrations (read-only). Migration 3 needs the column added by migration 2.
export const migrations = [
  { version: 1, up: 'CREATE TABLE tasks (id TEXT PRIMARY KEY, title TEXT NOT NULL, dueDate TEXT)' },
  { version: 2, up: 'ALTER TABLE tasks ADD COLUMN done INTEGER NOT NULL DEFAULT 0' },
  { version: 3, up: 'CREATE INDEX tasks_open_by_date ON tasks (done, dueDate)' },
];

export const fixtures = [
  { id: 't-01', title: '%%water%%', dueDate: '2026-03-02' },
  { id: 't-02', title: '%%library%%', dueDate: '2026-03-01' },
  { id: 't-03', title: '%%grandma%%', dueDate: null },
];
