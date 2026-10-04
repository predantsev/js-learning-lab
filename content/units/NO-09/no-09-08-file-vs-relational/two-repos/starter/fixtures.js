// The planner's synthetic tasks (read-only), and helpers that put them into a file and into SQLite.
import { writeFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';

export const tasks = [
  { id: 't-01', title: '%%t1%%', dueDate: '2026-03-02', done: false },
  { id: 't-02', title: '%%t2%%', dueDate: '2026-03-01', done: false },
  { id: 't-03', title: '%%t3%%', dueDate: null, done: false },
  { id: 't-04', title: '%%t4%%', dueDate: '2026-02-27', done: true },
  { id: 't-05', title: '%%t5%%', dueDate: '2026-03-10', done: false },
  { id: 't-06', title: '%%t6%%', dueDate: '2026-03-05', done: true },
];

export async function writeTasksFile(path, list = tasks) {
  await writeFile(path, JSON.stringify({ schemaVersion: 1, records: list }));
}

export function createTasksDb(list = tasks) {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE tasks (id TEXT PRIMARY KEY, title TEXT NOT NULL, dueDate TEXT, done INTEGER NOT NULL)');
  const insert = db.prepare('INSERT INTO tasks VALUES (?, ?, ?, ?)');
  for (const task of list) insert.run(task.id, task.title, task.dueDate, Number(task.done));
  return db;
}
