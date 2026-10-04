// Each check opens a fresh library through openLibrary and seeds it with data.js.
import { openLibrary, searchBooks, borrowBook } from './repo.js';
import { seedLibrary } from './data.js';

function library() {
  expect(typeof openLibrary, 'type of openLibrary').toBe('function');
  const db = openLibrary();
  seedLibrary(db);
  return db;
}
const loans = (db) => db.prepare('SELECT COUNT(*) AS n FROM loans').get().n;
const available = (db, bookId) => db.prepare('SELECT available FROM books WHERE id = ?').get(bookId).available;

test('a search for an injection payload finds nothing', () => {
  const db = library();
  expect(typeof searchBooks, 'type of searchBooks').toBe('function');
  expect(searchBooks(db, "x' OR 1=1 --"), "search for x' OR 1=1 --").toEqual([]);
});

test('an ordinary search still finds its book', () => {
  const db = library();
  expect(searchBooks(db, L.stars), `search for "${L.stars}"`).toEqual([L.stars]);
});

test('a loan for an unknown member is refused on a connection from openLibrary', () => {
  const db = library();
  expect(() => db.prepare("INSERT INTO loans (memberId, bookId, loanedOn) VALUES (9, 3, '2026-03-12')").run(), 'insert of a loan for member 9').toThrow(/FOREIGN KEY/);
});

test('a borrow that fails leaves no loan behind', () => {
  const db = library();
  const before = loans(db);
  try {
    borrowBook(db, 3, 2, '2026-03-12');
  } catch {
    // the error itself is checked in the next test
  }
  expect(loans(db), 'loans after a failed borrow of book 2').toBe(before);
  expect(available(db, 2), 'available copies of book 2').toBe(0);
});

test('a failed borrow is reported to the caller', () => {
  const db = library();
  expect(typeof borrowBook, 'type of borrowBook').toBe('function');
  expect(() => borrowBook(db, 3, 2, '2026-03-12'), 'borrow of book 2, which has no copy left').toThrow();
});

test('a successful borrow adds one loan and takes one copy', () => {
  const db = library();
  const before = loans(db);
  borrowBook(db, 3, 3, '2026-03-12');
  expect(loans(db), 'loans after borrowing book 3').toBe(before + 1);
  expect(available(db, 3), 'available copies of book 3').toBe(1);
});
