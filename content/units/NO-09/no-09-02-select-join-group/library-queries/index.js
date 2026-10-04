// SELECT, JOIN and GROUP BY on the synthetic library.
import { createLibrary } from './library.js';

const db = createLibrary();
const rows = (sql) => db.prepare(sql).all();
const show = (row) => Object.values(row).join(' · ');

// 1. One table: a condition, an order and a limit.
console.log('-- books with 2 or more copies, most copies first');
for (const row of rows('SELECT title, copies FROM books WHERE copies >= 2 ORDER BY copies DESC LIMIT 5')) console.log(show(row));

// 2. A join: one output row per matching pair of rows.
const joined = rows(`
  SELECT members.name, loans.id AS loanId
  FROM members
  LEFT JOIN loans ON loans.memberId = members.id
  ORDER BY members.id, loans.id
`);
console.log(`-- members joined with loans: ${joined.length} rows`);
for (const row of joined) console.log(show({ name: row.name, loanId: row.loanId ?? 'NULL' }));

// 3. Groups: one output row per member, with aggregates over that member's rows.
console.log('-- loans per member, only members with at least 2');
const grouped = rows(`
  SELECT members.name, COUNT(loans.id) AS loans
  FROM members
  JOIN loans ON loans.memberId = members.id
  GROUP BY members.id
  HAVING COUNT(loans.id) >= 2
  ORDER BY loans DESC
`);
for (const row of grouped) console.log(show(row));

db.close();
