// Your tests of monthSummary. They check a month in the middle only.
import { DatabaseSync } from 'node:sqlite';
import { test, expect } from './testing.js';
import { freshLedger } from './expenses-db.js';
import { monthSummary } from './summary.js';

test('March has home and fun', () => {
  const db = new DatabaseSync(freshLedger('summary-test'));
  const march = monthSummary(db, '2026-03', 2);
  db.close();
  expect(march.categories.map((row) => row.category), 'top 2 of March').toEqual(['transport', 'home']);
});
