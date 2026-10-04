// Reproduces the three reports against a freshly seeded library.
import { openLibrary, searchBooks, borrowBook } from './repo.js';
import { seedLibrary } from './data.js';

const db = openLibrary();
seedLibrary(db);
const loans = () => db.prepare('SELECT COUNT(*) AS n FROM loans').get().n;
const attempt = (label, work) => {
  try {
    console.log(label, '→', JSON.stringify(work() ?? 'ok'));
  } catch (error) {
    console.log(label, '→', error.message);
  }
};

attempt('search "%%stars%%"', () => searchBooks(db, '%%stars%%'));
attempt("search \"x' OR 1=1 --\"", () => searchBooks(db, "x' OR 1=1 --"));
attempt('loan for member 9', () => db.prepare("INSERT INTO loans (memberId, bookId, loanedOn) VALUES (9, 3, '2026-03-12')").run().changes);
console.log('loans before the borrow:', loans());
attempt('member 3 borrows book 2 (no copy left)', () => borrowBook(db, 3, 2, '2026-03-12'));
console.log('loans after the borrow: ', loans());
attempt('member 3 borrows book 3', () => borrowBook(db, 3, 3, '2026-03-12'));
console.log('loans at the end:       ', loans());
db.close();
