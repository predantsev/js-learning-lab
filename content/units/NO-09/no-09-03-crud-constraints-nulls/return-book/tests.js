// Each check builds a fresh database with the learner's loans table and calls returnBook.
import { DatabaseSync } from 'node:sqlite';
import { loansTable, returnBook } from './app.js';

function open() {
  expect(typeof loansTable, 'type of loansTable').toBe('string');
  expect(typeof returnBook, 'type of returnBook').toBe('function');
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT NOT NULL);
    INSERT INTO members VALUES (1, '${L.marta}'), (2, '${L.oleh}');
    INSERT INTO books VALUES (1, '${L.lighthouse}'), (2, '${L.garden}');
  `);
  db.exec(loansTable);
  return db;
}
const fill = (db) => db.exec(`
  INSERT INTO loans (id, memberId, bookId, loanedOn, returnedOn) VALUES
    (1, 1, 1, '2026-03-01', '2026-03-08'), (2, 1, 2, '2026-03-03', NULL), (3, 2, 1, '2026-03-04', NULL);
`);
const returnedOn = (db, id) => db.prepare(`SELECT returnedOn FROM loans WHERE id = ${id}`).get().returnedOn;

test('returning an open loan sets the date and returns 1', () => {
  const db = open();
  fill(db);
  expect(returnBook(db, 2, '2026-03-12'), 'value returned for open loan 2').toBe(1);
  expect(returnedOn(db, 2), 'returnedOn of loan 2').toBe('2026-03-12');
});

test('returning a loan that is already returned changes nothing and returns 0', () => {
  const db = open();
  fill(db);
  expect(returnBook(db, 1, '2026-03-12'), 'value returned for loan 1, returned on 2026-03-08').toBe(0);
  expect(returnedOn(db, 1), 'returnedOn of loan 1').toBe('2026-03-08');
});

test('only the loan with that id changes', () => {
  const db = open();
  fill(db);
  returnBook(db, 2, '2026-03-12');
  expect(returnedOn(db, 3), 'returnedOn of loan 3, which was not returned').toBeNull();
});

test('the table refuses a return date before the loan date', () => {
  const db = open();
  fill(db);
  expect(() => db.exec("UPDATE loans SET returnedOn = '2026-02-01' WHERE id = 3"), 'return of loan 3 (loaned 2026-03-04) on 2026-02-01').toThrow(/CHECK/);
});

test('the table still accepts an open loan with returnedOn NULL', () => {
  const db = open();
  expect(() => db.exec("INSERT INTO loans (memberId, bookId, loanedOn, returnedOn) VALUES (2, 2, '2026-03-09', NULL)"), 'insert of an open loan').not.toThrow();
});
