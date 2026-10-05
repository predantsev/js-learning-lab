// parseListQuery on its own, then the list route over real HTTP.
import { createApp } from './app.js';
import { parseListQuery } from './query.js';
import { createItemRepo } from './repo.js';

const parse = (query) => {
  expect(typeof parseListQuery, 'type of parseListQuery').toBe('function');
  return parseListQuery(new URLSearchParams(query));
};
const errorsOf = (query) => parse(query)?.errors ?? {};

test('no parameters give the defaults', () => {
  expect(parse(''), 'result for an empty query').toEqual({ ok: true, value: { limit: 20, offset: 0, sort: 'name' } });
});

test('valid values come back as numbers and an allowed sort', () => {
  expect(parse('limit=50&offset=40&sort=price'), 'result for limit=50&offset=40&sort=price').toEqual({ ok: true, value: { limit: 50, offset: 40, sort: 'price' } });
  expect(parse('limit=1&sort=category'), 'result for limit=1&sort=category').toEqual({ ok: true, value: { limit: 1, offset: 0, sort: 'category' } });
  expect(parse('offset=0'), 'result for offset=0').toEqual({ ok: true, value: { limit: 20, offset: 0, sort: 'name' } });
});

test('limit outside 1–50 is rejected', () => {
  for (const limit of ['0', '51', '-1', '1000']) {
    expect(parse(`limit=${limit}`), `result for limit=${limit}`).toEqual({ ok: false, errors: { limit: 'outOfRange' } });
  }
});

test('only plain digits count as a number', () => {
  for (const limit of ['1e1', ' 7', '7.0', '', '0x10', 'abc']) {
    expect(errorsOf(`limit=${encodeURIComponent(limit)}`), `errors for limit=${JSON.stringify(limit)}`).toEqual({ limit: 'outOfRange' });
  }
  for (const offset of ['1e2', '', '-0', '2.5']) {
    expect(errorsOf(`offset=${encodeURIComponent(offset)}`), `errors for offset=${JSON.stringify(offset)}`).toEqual({ offset: 'notWholeNumber' });
  }
});

test('sort accepts only name, price and category', () => {
  for (const sort of ['__proto__', 'constructor', 'toString', 'Name', 'id']) {
    expect(errorsOf(`sort=${sort}`), `errors for sort=${sort}`).toEqual({ sort: 'notAllowed' });
  }
});

test('a repeated parameter is rejected', () => {
  expect(errorsOf('limit=5&limit=500'), 'errors for limit=5&limit=500').toEqual({ limit: 'repeated' });
  expect(errorsOf('sort=name&sort=price'), 'errors for sort=name&sort=price').toEqual({ sort: 'repeated' });
});

test('an unknown parameter is rejected', () => {
  expect(errorsOf('debug=1'), 'errors for debug=1').toEqual({ debug: 'unknownParam' });
  expect(errorsOf('limit=5&isAdmin=true'), 'errors for limit=5&isAdmin=true').toEqual({ isAdmin: 'unknownParam' });
});

test('a parameter named __proto__ is rejected like any unknown one', () => {
  expect(parse('__proto__=1')?.ok, 'ok for __proto__=1').toBe(false);
  expect(errorsOf('limit=5&__proto__=x'), 'errors for limit=5&__proto__=x').toEqual({ ['__proto__']: 'unknownParam' });
});

test('every problem is reported at once', () => {
  expect(errorsOf('limit=0&sort=size&offset=x'), 'errors for limit=0&sort=size&offset=x')
    .toEqual({ limit: 'outOfRange', sort: 'notAllowed', offset: 'notWholeNumber' });
});

test('over HTTP a bad query answers 400 before the repository is called', async () => {
  const repo = createItemRepo();
  const base = await listen(createApp(repo));
  const bad = await request(`${base}/items?limit=-1`);
  expect(bad.status, 'status of GET /items?limit=-1').toBe(400);
  expect(repo.calls, 'repository calls after the bad request').toBe(0);
  const good = await request(`${base}/items?limit=2&sort=price`);
  expect(good.status, 'status of GET /items?limit=2&sort=price').toBe(200);
  expect(good.json?.items?.map((item) => item.name), 'names on the page').toEqual([L.mug, L.lamp]);
});
