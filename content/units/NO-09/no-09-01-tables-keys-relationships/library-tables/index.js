// A tiny synthetic library in SQLite: three tables linked by keys.
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(':memory:'); // a database that lives only in memory, for this run

db.exec(`
  CREATE TABLE members (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  );
  CREATE TABLE books (
    id    INTEGER PRIMARY KEY,
    title TEXT NOT NULL
  );
  CREATE TABLE loans (
    id       INTEGER PRIMARY KEY,
    memberId INTEGER NOT NULL REFERENCES members(id),
    bookId   INTEGER NOT NULL REFERENCES books(id),
    loanedOn TEXT NOT NULL
  );

  INSERT INTO members VALUES (1, '%%marta%%'), (2, '%%oleh%%'), (3, '%%borys%%'), (4, '%%taras%%');
  INSERT INTO books VALUES (1, '%%lighthouse%%'), (2, '%%garden%%'), (3, '%%stars%%');
  INSERT INTO loans VALUES
    (1, 1, 1, '2026-03-01'),
    (2, 1, 2, '2026-03-03'),
    (3, 2, 1, '2026-03-04'),
    (4, 1, 3, '2026-03-05'),
    (5, 3, 3, '2026-03-06');
`);

const all = (sql) => db.prepare(sql).all(); // every row of the result, as objects
console.log(`rows: members ${all('SELECT * FROM members').length}, books ${all('SELECT * FROM books').length}, loans ${all('SELECT * FROM loans').length}`);

// Loan 3 stores only two numbers. Follow them to the rows they point at.
const loan = all('SELECT * FROM loans WHERE id = 3')[0];
const member = all(`SELECT * FROM members WHERE id = ${loan.memberId}`)[0];
const book = all(`SELECT * FROM books WHERE id = ${loan.bookId}`)[0];
console.log(`loan 3 → member ${member.id} ${member.name}, book ${book.id} ${book.title}`);

// The same loans with the member's name copied into every row.
db.exec(`
  CREATE TABLE loans_flat (id INTEGER PRIMARY KEY, memberName TEXT, bookTitle TEXT);
  INSERT INTO loans_flat VALUES
    (1, '%%marta%%', '%%lighthouse%%'), (2, '%%marta%%', '%%garden%%'), (3, '%%oleh%%', '%%lighthouse%%'),
    (4, '%%marta%%', '%%stars%%'), (5, '%%borys%%', '%%stars%%');
`);

// Member 1 changes her name. UPDATE changes the rows that WHERE keeps.
db.exec(`UPDATE members SET name = '%%martaNew%%' WHERE id = 1`);
db.exec(`UPDATE loans_flat SET memberName = '%%martaNew%%' WHERE id = 4`); // only the loan being edited

const names = new Map(all('SELECT * FROM members').map((m) => [m.id, m.name]));
const viaKey = all('SELECT * FROM loans WHERE memberId = 1').map((l) => names.get(l.memberId));
console.log(`loans of member 1, by key:  ${viaKey.join(' | ')}`);
const copied = all('SELECT * FROM loans_flat WHERE id IN (1, 2, 4)').map((l) => l.memberName);
console.log(`loans of member 1, copied:  ${copied.join(' | ')}`);

db.close();
