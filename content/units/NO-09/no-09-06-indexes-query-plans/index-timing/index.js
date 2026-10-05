// 100 000 synthetic loans: query plans and timings before and after CREATE INDEX.
// Timings depend on your computer and vary between runs; compare them with each other, not with a book.
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(':memory:');
db.exec(`
  CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT NOT NULL);
  CREATE TABLE loans (id INTEGER PRIMARY KEY, memberId INTEGER NOT NULL, bookId INTEGER NOT NULL,
                      loanedOn TEXT NOT NULL, returnedOn TEXT);
  CREATE INDEX books_title ON books (title);
  INSERT INTO books (title) VALUES ('%%lighthouse%%'), ('%%garden%%'), ('%%stars%%');
`);

// Deterministic pseudo-random numbers, so every run generates the same data.
let seed = 42;
const random = (n) => ((seed = (seed * 1103515245 + 12345) % 2147483648) % n) + 1;

const insert = db.prepare('INSERT INTO loans (memberId, bookId, loanedOn) VALUES (?, ?, ?)');
function addLoans(count) {
  db.exec('BEGIN'); // one transaction for the whole batch is much faster than one per row
  for (let i = 0; i < count; i += 1) insert.run(random(2000), random(500), `2026-0${random(9)}-1${random(9)}`);
  db.exec('COMMIT');
}
const ms = (work) => {
  const start = performance.now();
  work();
  return (performance.now() - start).toFixed(1);
};
const plan = (sql) => db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all().map((row) => row.detail).join(' | ');

addLoans(100000);
const queries = {
  A: 'SELECT * FROM loans WHERE memberId = 7',
  B: 'SELECT * FROM loans WHERE bookId = 7',
  C: "SELECT * FROM books WHERE lower(title) = 'x'",
  D: "SELECT * FROM books WHERE title = 'x'",
};
const byMember = db.prepare('SELECT COUNT(*) AS n FROM loans WHERE memberId = ?');
const lookups = () => { for (let m = 1; m <= 200; m += 1) byMember.get(m); };

console.log('-- without an index on loans(memberId)');
for (const [name, sql] of Object.entries(queries)) console.log(`${name}: ${plan(sql)}`);
console.log(`200 lookups by memberId: ${ms(lookups)} ms`);
console.log(`10 000 inserts: ${ms(() => addLoans(10000))} ms`);

db.exec('CREATE INDEX loans_member ON loans (memberId)');

console.log('-- with CREATE INDEX loans_member ON loans (memberId)');
for (const [name, sql] of Object.entries(queries)) console.log(`${name}: ${plan(sql)}`);
console.log(`200 lookups by memberId: ${ms(lookups)} ms`);
console.log(`10 000 inserts: ${ms(() => addLoans(10000))} ms`);

db.close();
