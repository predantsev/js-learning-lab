// Checks apply indexSql to 20 000 generated loans and read the query plan (EXPLAIN QUERY PLAN).
// Plan lines are matched by their meaning (SEARCH / SCAN / TEMP B-TREE), not by exact text.
import { createLoans, openLoansSql, planOf } from './data.js';
import { indexSql } from './app.js';

function withIndex() {
  expect(typeof indexSql, 'type of indexSql').toBe('string');
  const db = createLoans(20000);
  db.exec(indexSql);
  return db;
}

test('the plan searches loans through an index', () => {
  const db = withIndex();
  const plan = planOf(db, openLoansSql);
  db.close();
  expect(plan.some((line) => /^SEARCH loans USING (COVERING )?INDEX/.test(line)), `plan: ${plan.join(' | ')}`).toBe(true);
});

test('the plan needs no extra sort', () => {
  const db = withIndex();
  const plan = planOf(db, openLoansSql);
  db.close();
  expect(plan.some((line) => /TEMP B-TREE/.test(line)), `plan: ${plan.join(' | ')}`).toBe(false);
});

test('it adds exactly one index, on two or more columns', () => {
  const db = withIndex();
  const added = db.prepare('PRAGMA index_list(loans)').all().filter((index) => index.origin === 'c');
  const columns = added.map((index) => db.prepare(`PRAGMA index_info(${JSON.stringify(index.name)})`).all().length);
  db.close();
  expect(added.length, 'indexes created by indexSql').toBe(1);
  expect(columns[0], 'columns in the index').toBeGreaterThanOrEqual(2);
});

// Rows with the same loanedOn may come in any order (ORDER BY names only the date), so the rows are
// compared as a set, and the dates must still go from newest to oldest.
const ids = (rows) => rows.map((row) => row.id).sort((a, b) => a - b).join(',');
test('the query returns the same rows with the index', () => {
  const plain = createLoans(20000);
  const expected = plain.prepare(openLoansSql).all(17);
  plain.close();
  const db = withIndex();
  const actual = db.prepare(openLoansSql).all(17);
  db.close();
  expect(ids(actual), 'ids of the open loans of member 17').toBe(ids(expected));
  const dates = actual.map((row) => row.loanedOn);
  expect(dates.every((date, i) => i === 0 || dates[i - 1] >= date), 'dates go from newest to oldest').toBe(true);
});
