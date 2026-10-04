// The same search built two ways: text glued into the SQL, and a value bound to a placeholder.
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(':memory:');
db.exec(`
  CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT NOT NULL, copies INTEGER NOT NULL);
  INSERT INTO books VALUES (1, '%%lighthouse%%', 2), (2, '%%garden%%', 1), (3, '%%stars%%', 3);
`);

function searchGlued(input) {
  const sql = `SELECT title FROM books WHERE title = '${input}'`; // the input becomes part of the SQL text
  return db.prepare(sql).all().map((b) => b.title);
}
function searchBound(input) {
  return db.prepare('SELECT title FROM books WHERE title = ?').all(input).map((b) => b.title); // the input is only a value
}

for (const input of ['%%stars%%', "x' OR 1=1 --"]) {
  console.log(`input: ${input}`);
  console.log(`  glued: ${searchGlued(input).length} row(s)`);
  console.log(`  bound: ${searchBound(input).length} row(s)`);
}

// LIKE with a parameter: the % signs are added to the value in JavaScript, never to the SQL text.
const term = '%%term%%';
const found = db.prepare('SELECT title FROM books WHERE title LIKE ?').all(`%${term}%`).map((b) => b.title);
console.log(`LIKE %${term}%: ${found.join(', ')}`);

// A column name cannot be a parameter. Bound, it is only the text 'copies' — the same for every row.
const sort = 'copies';
const boundSort = db.prepare('SELECT title FROM books ORDER BY ?').all(sort).map((b) => b.title);
console.log(`ORDER BY ? with '${sort}': ${boundSort.join(', ')}`);

// An allowlist maps the request's word to SQL text that we wrote ourselves.
const SORTS = { title: 'title', copies: 'copies DESC' };
if (!Object.hasOwn(SORTS, sort)) throw new Error(`unknown sort: ${sort}`);
const sorted = db.prepare(`SELECT title FROM books ORDER BY ${SORTS[sort]}`).all().map((b) => b.title);
console.log(`allowlist '${sort}' → ${SORTS[sort]}: ${sorted.join(', ')}`);

db.close();
