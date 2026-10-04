// Checks call searchBooks on a fresh catalog. Expected title orders are computed with the same
// code-unit comparison SQLite's default (BINARY) collation uses for these titles.
import { createCatalog } from './catalog.js';
import { searchBooks } from './app.js';

const books = [
  { title: L.lighthouse, copies: 2 },
  { title: L.winter, copies: 4 },
  { title: L.stars, copies: 3 },
  { title: L.spring, copies: 1 },
];
const byTitle = (a, b) => (a.title < b.title ? -1 : a.title > b.title ? 1 : 0);

function search(query) {
  expect(typeof searchBooks, 'type of searchBooks').toBe('function');
  const db = createCatalog();
  try {
    return searchBooks(db, query).map((row) => `${row.title} (${row.copies})`);
  } finally {
    db.close();
  }
}
const label = (list) => list.map((b) => `${b.title} (${b.copies})`);

test('finds the books whose title contains the text', () => {
  const expected = books.filter((b) => b.title.includes(L.term)).sort(byTitle);
  expect(search({ title: L.term, sort: 'title' }), `search for "${L.term}"`).toEqual(label(expected));
});

test('a title with a quote finds nothing and does not crash', () => {
  expect(search({ title: "'", sort: 'title' }), 'search for a single quote').toEqual([]);
});

test('an injection attempt is only searched for, never run', () => {
  expect(search({ title: "%' OR 1=1 --", sort: 'title' }), "search for %' OR 1=1 --").toEqual([]);
});

test('sort title orders the books by title', () => {
  expect(search({ title: '', sort: 'title' }), 'all books, sort title').toEqual(label([...books].sort(byTitle)));
});

test('sort copies puts the books with most copies first', () => {
  expect(search({ title: '', sort: 'copies' }), 'all books, sort copies').toEqual(label([...books].sort((a, b) => b.copies - a.copies)));
});

test('an unknown sort is refused and the table is untouched', () => {
  expect(typeof searchBooks, 'type of searchBooks').toBe('function');
  const db = createCatalog();
  let refused = false;
  try {
    searchBooks(db, { title: '', sort: 'copies; DROP TABLE books' });
  } catch {
    refused = true;
  }
  const left = db.prepare('SELECT COUNT(*) AS n FROM books').get().n;
  db.close();
  expect(refused, 'searchBooks throws for the sort "copies; DROP TABLE books"').toBe(true);
  expect(left, 'books left in the table').toBe(4);
});
