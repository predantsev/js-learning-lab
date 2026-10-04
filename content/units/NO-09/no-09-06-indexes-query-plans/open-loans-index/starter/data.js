// Synthetic data for this exercise (read-only): a loans table filled with `count` generated rows.
import { DatabaseSync } from 'node:sqlite';

export const openLoansSql =
  'SELECT id, bookId, loanedOn FROM loans WHERE memberId = ? AND returnedOn IS NULL ORDER BY loanedOn DESC';

export function createLoans(count) {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE loans (id INTEGER PRIMARY KEY, memberId INTEGER NOT NULL, bookId INTEGER NOT NULL,
                               loanedOn TEXT NOT NULL, returnedOn TEXT)`);
  let seed = 7;
  const random = (n) => ((seed = (seed * 1103515245 + 12345) % 2147483648) % n) + 1;
  const insert = db.prepare('INSERT INTO loans (memberId, bookId, loanedOn, returnedOn) VALUES (?, ?, ?, ?)');
  db.exec('BEGIN');
  for (let i = 0; i < count; i += 1) {
    const day = String(random(28)).padStart(2, '0');
    const loanedOn = `2026-0${random(9)}-${day}`;
    insert.run(random(1000), random(300), loanedOn, random(4) === 1 ? null : loanedOn); // about 1 in 4 is open
  }
  db.exec('COMMIT');
  return db;
}

export const planOf = (db, sql) => db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all().map((row) => row.detail);
