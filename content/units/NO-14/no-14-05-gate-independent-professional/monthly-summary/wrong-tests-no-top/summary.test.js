// Your tests of monthSummary. They must pass on your summary.js and fail on broken ones.
// Register tests with test(name, fn) from ./testing.js. freshLedger(name) in ./expenses-db.js
// writes a ledger file with the fixtures; open it with new DatabaseSync(file) from node:sqlite.
import { DatabaseSync } from 'node:sqlite';
import { test, expect } from './testing.js';
import { freshLedger } from './expenses-db.js';
import { monthSummary } from './summary.js';

const summaryOf = (month, top) => {
  const db = new DatabaseSync(freshLedger('summary-test'));
  try {
    return monthSummary(db, month, top);
  } finally {
    db.close();
  }
};

// The fixtures have expenses on 28 February, 1 and 31 March and 1 April: the edges of March.
test('March counts 1 and 31 March, but not 28 February or 1 April', () => {
  const march = summaryOf('2026-03');
  expect(march.total, 'total of March').toBe(52000 + 1890 + 9990 + 2600 + 3310);
  expect(march.categories.map((row) => `${row.category} ${row.total} ${row.count}`), 'categories of March').toEqual(['transport 52000 1', 'home 9990 1', 'food 5200 2', 'fun 2600 1']);
});

test('a month without expenses has a zero total', () => {
  expect(summaryOf('2026-05'), 'May').toEqual({ month: '2026-05', total: 0, categories: [] });
});
