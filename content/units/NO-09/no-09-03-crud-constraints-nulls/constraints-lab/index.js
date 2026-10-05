// INSERT, UPDATE and DELETE against a library whose tables carry constraints.
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(':memory:'); // node:sqlite switches foreign keys on by default
db.exec(`
  CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
  CREATE TABLE books (
    id     INTEGER PRIMARY KEY,
    title  TEXT NOT NULL,
    isbn   TEXT NOT NULL UNIQUE,
    copies INTEGER NOT NULL CHECK (copies >= 0)
  );
  CREATE TABLE loans (
    id         INTEGER PRIMARY KEY,
    memberId   INTEGER NOT NULL REFERENCES members(id),
    bookId     INTEGER NOT NULL REFERENCES books(id),
    loanedOn   TEXT NOT NULL,
    returnedOn TEXT
  );
  INSERT INTO members VALUES (1, '%%marta%%'), (2, '%%oleh%%'), (3, '%%borys%%');
  INSERT INTO books VALUES (1, '%%lighthouse%%', 'LIB-001', 2), (2, '%%garden%%', 'LIB-002', 1), (3, '%%stars%%', 'LIB-003', 3);
  INSERT INTO loans VALUES
    (1, 1, 1, '2026-03-01', '2026-03-08'), (2, 1, 2, '2026-03-03', NULL), (3, 2, 1, '2026-03-04', NULL),
    (4, 1, 3, '2026-03-05', NULL), (5, 3, 3, '2026-03-06', '2026-03-10');
`);
const count = (where) => db.prepare(`SELECT COUNT(*) AS n FROM loans WHERE ${where}`).get().n;

console.log('-- NULL');
console.log(`returnedOn = NULL:  ${count('returnedOn = NULL')}`);
console.log(`returnedOn IS NULL: ${count('returnedOn IS NULL')}`);

console.log('-- constraints');
const attempts = [
  ["a second book with isbn LIB-001", "INSERT INTO books (title, isbn, copies) VALUES ('%%atlas%%', 'LIB-001', 1)"],
  ['a book with -1 copies', "INSERT INTO books (title, isbn, copies) VALUES ('%%atlas%%', 'LIB-004', -1)"],
  ['a book without a title', "INSERT INTO books (isbn, copies) VALUES ('LIB-005', 1)"],
  ['a loan for member 9', "INSERT INTO loans (memberId, bookId, loanedOn) VALUES (9, 1, '2026-03-11')"],
  ['a book with 0 copies', "INSERT INTO books (title, isbn, copies) VALUES ('%%atlas%%', 'LIB-006', 0)"],
];
for (const [what, sql] of attempts) {
  try {
    const { changes } = db.prepare(sql).run();
    console.log(`${what}: ok, ${changes} row added`);
  } catch (error) {
    console.log(`${what}: ${error.message}`);
  }
}

console.log('-- UPDATE and DELETE report how many rows they changed');
const returned = db.prepare("UPDATE loans SET returnedOn = '2026-03-12' WHERE id = 3 AND returnedOn IS NULL").run();
console.log(`return loan 3: ${returned.changes} row(s) changed`);
const again = db.prepare("UPDATE loans SET returnedOn = '2026-03-13' WHERE id = 3 AND returnedOn IS NULL").run();
console.log(`return loan 3 again: ${again.changes} row(s) changed`);
const removed = db.prepare('DELETE FROM loans WHERE returnedOn IS NOT NULL').run();
console.log(`delete returned loans: ${removed.changes} row(s) removed, ${count('1 = 1')} left`);

db.close();
