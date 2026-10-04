// listRecords on its own, then GET /expenses over real HTTP.
import { createApp } from './app.js';
import { seedExpenses } from './expenses.js';
import { listRecords } from './list.js';

const list = (records, query) => {
  expect(typeof listRecords, 'type of listRecords').toBe('function');
  return listRecords(records, query);
};
const ids = (result) => (result?.items ?? []).map((record) => record.id);

test('filters by category before paging', () => {
  expect(ids(list(seedExpenses, { category: 'fun', limit: '50' })), 'ids for category=fun').toEqual(['e-05', 'e-03', 'e-09', 'e-12']);
  expect(ids(list(seedExpenses, { category: 'food', sort: 'amountMinor', limit: '2' })), 'ids for category=food, limit=2').toEqual(['e-08', 'e-06']);
});

test('sorts by date, and equal dates by id', () => {
  const shuffled = seedExpenses.toReversed();
  expect(ids(list(shuffled, { limit: '50' })), 'ids sorted by date (input in reverse order)')
    .toEqual(['e-04', 'e-05', 'e-03', 'e-01', 'e-02', 'e-06', 'e-07', 'e-08', 'e-09', 'e-10', 'e-11', 'e-12']);
});

test('sorts by amountMinor when asked', () => {
  expect(ids(list(seedExpenses, { sort: 'amountMinor', limit: '5' })), 'first five by amountMinor').toEqual(['e-10', 'e-08', 'e-04', 'e-03', 'e-07']);
});

test('walking the pages by cursor returns every expense once, and the last nextCursor is null', () => {
  const seen = [];
  let cursor;
  let pages = 0;
  for (let page = 0; page < 5; page++) {
    const result = list(seedExpenses, { sort: 'amountMinor', limit: '4', ...(cursor ? { cursor } : {}) });
    expect(result?.ok, `ok of page ${page + 1}`).toBe(true);
    seen.push(...ids(result));
    pages += 1;
    cursor = result.nextCursor;
    if (cursor === null) break;
  }
  expect(seen, 'ids of all pages together').toEqual(['e-10', 'e-08', 'e-04', 'e-03', 'e-07', 'e-12', 'e-06', 'e-05', 'e-11', 'e-02', 'e-01', 'e-09']);
  expect(pages, 'pages read until nextCursor was null (12 expenses, 4 per page)').toBe(3);
});

test('limit must be a whole number from 1 to 50; the default is 10', () => {
  for (const limit of ['0', '51', '2.5', 'many']) {
    expect(list(seedExpenses, { limit })?.errors?.limit, `errors.limit for limit=${limit}`).toBe('outOfRange');
  }
  expect(ids(list(seedExpenses, { limit: '1' })).length, 'items for limit=1').toBe(1);
  expect(ids(list(seedExpenses, { limit: '50' })).length, 'items for limit=50').toBe(12);
  expect(ids(list(seedExpenses, {})).length, 'items without limit').toBe(10);
});

test('an unknown sort or cursor is refused', () => {
  expect(list(seedExpenses, { sort: 'label' })?.errors?.sort, 'errors.sort for sort=label').toBe('unknownSort');
  expect(list(seedExpenses, { cursor: 'e-99' })?.errors?.cursor, 'errors.cursor for cursor=e-99').toBe('unknownCursor');
});

test('over HTTP a record added between two pages is neither repeated nor skipped', async () => {
  const base = await listen(createApp());
  const first = await request(`${base}/expenses?limit=4`);
  expect(first.status, 'status of page 1').toBe(200);
  // Another client adds an expense dated before everything on page 1.
  await request(`${base}/expenses`, { method: 'POST', body: { id: 'e-13', label: 'x', amountMinor: 1000, date: '2026-02-01', category: 'home' } });
  const second = await request(`${base}/expenses?limit=4&cursor=${first.json?.nextCursor}`);
  expect(second.status, 'status of page 2').toBe(200);
  expect((second.json?.items ?? []).map((record) => record.id), 'ids of page 2').toEqual(['e-02', 'e-06', 'e-07', 'e-08']);
  const bad = await request(`${base}/expenses?limit=500`);
  expect(bad.status, 'status for limit=500').toBe(400);
});
