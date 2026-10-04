// The club's storage: one SQLite file. openClub(file) → the functions the API uses.
import { DatabaseSync } from 'node:sqlite';

export function openClub(file) {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON');

  // Each total comes from its own table. Joining reads and votes to the member in one query made
  // one row per (reading, vote) pair, so every sum and count was multiplied by the other side.
  const summaryQuery = db.prepare(`
    SELECT m.id AS id, m.name AS name,
           r.pagesRead AS pagesRead,
           (SELECT COUNT(*) FROM votes v WHERE v.memberId = m.id) AS votes
    FROM members m
    JOIN (SELECT memberId, SUM(pages) AS pagesRead FROM reads GROUP BY memberId) r ON r.memberId = m.id
    ORDER BY m.id
  `);
  const insertRead = db.prepare('INSERT INTO reads (memberId, bookId, pages) VALUES (?, ?, ?)');
  const memberExists = db.prepare('SELECT 1 AS found FROM members WHERE id = ?');
  const bookExists = db.prepare('SELECT 1 AS found FROM books WHERE id = ?');

  return {
    // Every member with the pages they logged and their votes for the next book, by id.
    summary() {
      return summaryQuery.all().map((row) => ({ id: row.id, name: row.name, pagesRead: row.pagesRead, votes: row.votes }));
    },
    hasMember: (id) => memberExists.get(id) !== undefined,
    hasBook: (id) => bookExists.get(id) !== undefined,
    addRead({ memberId, bookId, pages }) {
      insertRead.run(memberId, bookId, pages);
    },
    close: () => db.close(),
  };
}
