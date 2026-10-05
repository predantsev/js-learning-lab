// Creates the library with your loans table, returns loan 2 twice and tries a return date before the loan date.
import { DatabaseSync } from 'node:sqlite';
import { loansTable, returnBook } from './app.js';

const db = new DatabaseSync(':memory:');
db.exec(`
  CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
  CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT NOT NULL);
  INSERT INTO members VALUES (1, '%%marta%%'), (2, '%%oleh%%');
  INSERT INTO books VALUES (1, '%%lighthouse%%'), (2, '%%garden%%');
`);
db.exec(loansTable);
db.exec(`
  INSERT INTO loans (id, memberId, bookId, loanedOn, returnedOn) VALUES
    (1, 1, 1, '2026-03-01', '2026-03-08'), (2, 1, 2, '2026-03-03', NULL), (3, 2, 1, '2026-03-04', NULL);
`);

const show = () => db.prepare('SELECT id, returnedOn FROM loans ORDER BY id').all().map((l) => `${l.id}:${l.returnedOn}`).join(' ');
console.log('before:', show());
console.log('return loan 2 on 2026-03-12 →', returnBook(db, 2, '2026-03-12'));
console.log('return loan 2 on 2026-03-15 →', returnBook(db, 2, '2026-03-15'));
console.log('after: ', show());
try {
  returnBook(db, 3, '2026-02-01');
  console.log('return loan 3 on 2026-02-01 → accepted');
} catch (error) {
  console.log('return loan 3 on 2026-02-01 →', error.message);
}
db.close();
