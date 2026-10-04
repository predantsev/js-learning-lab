// An in-memory SQLite database for the import: expenses plus the ids of the jobs already applied.
import { DatabaseSync } from 'node:sqlite';

export function createDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE expenses (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      amountMinor INTEGER NOT NULL CHECK (amountMinor > 0)
    );
    CREATE TABLE processed_jobs (jobId TEXT PRIMARY KEY);
  `);
  return db;
}

export function countExpenses(db) {
  return db.prepare('SELECT COUNT(*) AS count FROM expenses').get().count;
}
