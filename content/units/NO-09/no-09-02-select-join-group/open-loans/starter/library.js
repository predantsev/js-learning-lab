// The synthetic library of this unit: members, books and loans (an open loan has returnedOn NULL).
import { DatabaseSync } from 'node:sqlite';

export function createLibrary(location = ':memory:') {
  const db = new DatabaseSync(location);
  db.exec(`
    CREATE TABLE members (
      id   INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    );
    CREATE TABLE books (
      id     INTEGER PRIMARY KEY,
      title  TEXT NOT NULL,
      copies INTEGER NOT NULL
    );
    CREATE TABLE loans (
      id         INTEGER PRIMARY KEY,
      memberId   INTEGER NOT NULL REFERENCES members(id),
      bookId     INTEGER NOT NULL REFERENCES books(id),
      loanedOn   TEXT NOT NULL,
      returnedOn TEXT
    );
    INSERT INTO members VALUES (1, '%%marta%%'), (2, '%%oleh%%'), (3, '%%borys%%'), (4, '%%taras%%');
    INSERT INTO books VALUES (1, '%%lighthouse%%', 2), (2, '%%garden%%', 1), (3, '%%stars%%', 3);
    INSERT INTO loans VALUES
      (1, 1, 1, '2026-03-01', '2026-03-08'),
      (2, 1, 2, '2026-03-03', NULL),
      (3, 2, 1, '2026-03-04', NULL),
      (4, 1, 3, '2026-03-05', NULL),
      (5, 3, 3, '2026-03-06', '2026-03-10');
  `);
  return db;
}
