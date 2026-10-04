// borrowBook takes two statements. The second one fails for a book with no copies left.
// Run once without a transaction, once with one, then watch a second connection during a transaction.
import { DatabaseSync } from 'node:sqlite';

function openLibrary(location) {
  const db = new DatabaseSync(location);
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY, title TEXT NOT NULL, available INTEGER NOT NULL CHECK (available >= 0));
    CREATE TABLE IF NOT EXISTS loans (id INTEGER PRIMARY KEY, memberId INTEGER NOT NULL, bookId INTEGER NOT NULL REFERENCES books(id), loanedOn TEXT NOT NULL);
  `);
  return db;
}
function fill(db) {
  db.exec(`
    INSERT INTO books VALUES (1, '%%lighthouse%%', 1), (2, '%%garden%%', 0), (3, '%%stars%%', 2);
    INSERT INTO loans (memberId, bookId, loanedOn) VALUES (1, 1, '2026-03-01'), (1, 2, '2026-03-03'), (2, 1, '2026-03-04');
  `);
}
const state = (db) => {
  const loans = db.prepare('SELECT COUNT(*) AS n FROM loans').get().n;
  const garden = db.prepare('SELECT available FROM books WHERE id = 2').get().available;
  return `loans ${loans}, book 2 available ${garden}`;
};

function borrowBook(db, memberId, bookId) {
  db.prepare("INSERT INTO loans (memberId, bookId, loanedOn) VALUES (?, ?, '2026-03-12')").run(memberId, bookId);
  db.prepare('UPDATE books SET available = available - 1 WHERE id = ?').run(bookId); // fails when available is 0
}

function borrowInTransaction(db, memberId, bookId) {
  db.exec('BEGIN');
  try {
    borrowBook(db, memberId, bookId);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK'); // undo every statement since BEGIN
    throw error;
  }
}

for (const [label, borrow] of [['without a transaction', borrowBook], ['with a transaction', borrowInTransaction]]) {
  const db = openLibrary(':memory:');
  fill(db);
  console.log(`-- ${label}`);
  console.log('before: ', state(db));
  try {
    borrow(db, 3, 2);
  } catch (error) {
    console.log('borrow failed:', error.message);
  }
  console.log('after:  ', state(db));
  db.close();
}

// Two connections to one database file: A changes it inside a transaction, B reads meanwhile.
console.log('-- two connections');
const a = openLibrary('library.db');
fill(a);
const b = openLibrary('library.db');
a.exec('BEGIN');
a.prepare("INSERT INTO loans (memberId, bookId, loanedOn) VALUES (3, 3, '2026-03-12')").run();
console.log('A inserted a loan, not committed yet');
console.log('B reads:', state(b));
try {
  b.prepare('UPDATE books SET available = 5 WHERE id = 3').run();
} catch (error) {
  console.log('B tries to write:', error.message);
}
a.exec('COMMIT');
console.log('A committed. B reads:', state(b));
a.close();
b.close();
