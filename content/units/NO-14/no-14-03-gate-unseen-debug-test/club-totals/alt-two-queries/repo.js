// The club's storage: one SQLite file. openClub(file) → the functions the API uses.
import { DatabaseSync } from 'node:sqlite';

export function openClub(file) {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON');

  // Two grouped queries, one per table, merged by member id: no row is ever multiplied.
  const pagesQuery = db.prepare(`
    SELECT m.id AS id, m.name AS name, COALESCE(SUM(r.pages), 0) AS pagesRead
    FROM members m LEFT JOIN reads r ON r.memberId = m.id
    GROUP BY m.id ORDER BY m.id
  `);
  const votesQuery = db.prepare('SELECT memberId, COUNT(*) AS votes FROM votes GROUP BY memberId');
  const insertRead = db.prepare('INSERT INTO reads (memberId, bookId, pages) VALUES (?, ?, ?)');
  const memberExists = db.prepare('SELECT 1 AS found FROM members WHERE id = ?');
  const bookExists = db.prepare('SELECT 1 AS found FROM books WHERE id = ?');

  return {
    summary() {
      const votes = new Map(votesQuery.all().map((row) => [row.memberId, row.votes]));
      return pagesQuery.all().map((row) => ({ id: row.id, name: row.name, pagesRead: row.pagesRead, votes: votes.get(row.id) ?? 0 }));
    },
    hasMember: (id) => memberExists.get(id) !== undefined,
    hasBook: (id) => bookExists.get(id) !== undefined,
    addRead({ memberId, bookId, pages }) {
      insertRead.run(memberId, bookId, pages);
    },
    close: () => db.close(),
  };
}
