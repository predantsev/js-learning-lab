// The repaired wishlist API over real HTTP: the three defects, and the answers that must not change.
import { createApp } from './app.js';

const start = () => listen(createApp());

test('an invalid PATCH answers 400 VALIDATION_FAILED and changes nothing', async () => {
  const base = await start();
  const patched = await request(`${base}/records/w-02`, { method: 'PATCH', body: { price: '45', name: null } });
  expect(patched.status, 'status of PATCH { price: "45", name: null }').toBe(400);
  expect(patched.json?.error?.code, 'error code of the bad PATCH').toBe('VALIDATION_FAILED');
  const after = await request(`${base}/records/w-02`);
  expect(after.json, 'w-02 after the bad PATCH').toEqual({ id: 'w-02', name: L.lamp, price: 45, acquired: false, category: L.home });
  const sorted = await request(`${base}/records?sort=name`);
  expect(sorted.status, 'status of GET /records?sort=name after the bad PATCH').toBe(200);
});

test('a valid PATCH still answers 200 with the whole updated wish', async () => {
  const base = await start();
  const patched = await request(`${base}/records/w-01`, { method: 'PATCH', body: { acquired: true } });
  expect(patched.status, 'status of PATCH { acquired: true }').toBe(200);
  expect(patched.json, 'w-01 after the PATCH').toEqual({ id: 'w-01', name: L.headphones, price: 80, acquired: true, category: L.tech });
});

test('an unexpected error answers 500 INTERNAL with no message and no stack', async () => {
  const base = await start();
  const response = await request(`${base}/records/w-01/share`);
  expect(response.status, 'status of GET /records/w-01/share').toBe(500);
  expect(response.json, 'body of the 500').toEqual({ error: { code: 'INTERNAL', messageKey: 'errors.internal', details: {}, requestId: response.headers['x-request-id'] } });
});

test('a missing wish answers 404 NOT_FOUND', async () => {
  const base = await start();
  const response = await request(`${base}/records/w-09`);
  expect(response.status, 'status of GET /records/w-09').toBe(404);
  expect(response.json?.error?.code, 'error code of GET /records/w-09').toBe('NOT_FOUND');
});

test('a retried POST with the same Idempotency-Key creates one wish', async () => {
  const base = await start();
  const send = () => request(`${base}/records`, { method: 'POST', body: { name: L.mug, price: 18 }, headers: { 'Idempotency-Key': 'k-1' } });
  const first = await send();
  const again = await send();
  expect(first.status, 'status of the first POST').toBe(201);
  expect(again.json, 'body of the retried POST').toEqual(first.json);
  const list = await request(`${base}/records`);
  expect(list.json?.length, 'wishes after the retry').toBe(3);
});

test('POST still answers 201 for a new wish and 400 for an invalid one', async () => {
  const base = await start();
  const created = await request(`${base}/records`, { method: 'POST', body: { name: `  ${L.mug} ` } });
  expect(created.status, 'status of a valid POST').toBe(201);
  expect(created.json?.name, 'name of the created wish').toBe(L.mug);
  const refused = await request(`${base}/records`, { method: 'POST', body: { price: -1 } });
  expect(refused.status, 'status of an invalid POST').toBe(400);
});
