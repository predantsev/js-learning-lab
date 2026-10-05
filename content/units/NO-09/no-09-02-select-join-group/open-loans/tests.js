// Checks run openLoanCounts on the library fixture and on the fixture plus one more member.
import { createLibrary } from './library.js';
import { openLoanCounts } from './app.js';

const expected = { [L.marta]: 2, [L.oleh]: 1, [L.borys]: 0, [L.taras]: 0 };

function counts(extra = false) {
  expect(typeof openLoanCounts, 'type of openLoanCounts').toBe('function');
  const db = createLibrary();
  if (extra) {
    // Anna: one open loan, the same count as Oleh; her name sorts before his in both languages.
    db.exec(`INSERT INTO members VALUES (5, '${L.anna}'); INSERT INTO loans VALUES (6, 5, 2, '2026-03-07', NULL);`);
  }
  const rows = openLoanCounts(db).map((row) => ({ ...row }));
  db.close();
  return rows;
}

test('every member is listed once, with the fields name and open', () => {
  const rows = counts();
  expect(rows.map((r) => r.name).sort(), 'names in the result').toEqual(Object.keys(expected).sort());
  for (const row of rows) expect(Object.keys(row).sort(), `fields of the row of ${row.name}`).toEqual(['name', 'open']);
});

test('open counts only loans that are not returned, and 0 when there are none', () => {
  for (const row of counts()) expect(row.open, `open loans of ${row.name}`).toBe(expected[row.name]);
});

test('rows are ordered by open loans, most first, then by name', () => {
  expect(counts(true).map((r) => `${r.name} ${r.open}`), 'rows in order').toEqual([
    `${L.marta} 2`, `${L.anna} 1`, `${L.oleh} 1`, `${L.borys} 0`, `${L.taras} 0`,
  ]);
});
