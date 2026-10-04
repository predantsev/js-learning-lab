// The library repository of a small server. Three reported problems:
// - searching for  x' OR 1=1 --  lists every book;
// - a loan for a member who does not exist was saved;
// - after a failed borrow the loans table had one loan too many.
//
// About this lab: node:sqlite enforces foreign keys by default (option enableForeignKeyConstraints),
// while SQLite itself, the sqlite3 shell and some other drivers start with them off. Here the
// switch-off is written out in openLibrary, as a leftover from a bulk import.
import { DatabaseSync } from 'node:sqlite';

export function openLibrary(location = ':memory:') {
  const db = new DatabaseSync(location);
  db.exec('PRAGMA foreign_keys = OFF'); // the import loads loans before members
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY, title TEXT NOT NULL,
                                      available INTEGER NOT NULL CHECK (available >= 0));
    CREATE TABLE IF NOT EXISTS loans (id INTEGER PRIMARY KEY, memberId INTEGER NOT NULL REFERENCES members(id),
                                      bookId INTEGER NOT NULL REFERENCES books(id), loanedOn TEXT NOT NULL);
  `);
  return db;
}

export function searchBooks(db, title) {
  return db.prepare(`SELECT title FROM books WHERE title = '${title}' ORDER BY id`).all().map((b) => b.title);
}

export function borrowBook(db, memberId, bookId, today) {
  db.prepare('INSERT INTO loans (memberId, bookId, loanedOn) VALUES (?, ?, ?)').run(memberId, bookId, today);
  db.prepare('UPDATE books SET available = available - 1 WHERE id = ?').run(bookId); // CHECK fails at 0
}
