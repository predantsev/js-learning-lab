// POST /tasks over real HTTP, with and without an Idempotency-Key.
import { createApp } from './app.js';

const post = (base, value, key) => request(`${base}/tasks`, { method: 'POST', body: value, headers: key ? { 'idempotency-key': key } : {} });
const count = async (base) => ((await request(`${base}/tasks`)).json ?? []).length;

test('a retried POST with the same key creates one task', async () => {
  const base = await listen(createApp());
  await post(base, { title: L.dentist }, 'key-1');
  await post(base, { title: L.dentist }, 'key-1');
  expect(await count(base), 'tasks after two POSTs with key-1').toBe(3);
});

test('the replay repeats the first answer: status 201 and the same task', async () => {
  const base = await listen(createApp());
  const first = await post(base, { title: L.dentist }, 'key-2');
  const again = await post(base, { title: L.dentist }, 'key-2');
  expect(first.status, 'status of the first POST').toBe(201);
  expect(again.status, 'status of the retried POST').toBe(201);
  expect(again.json, 'body of the retried POST').toEqual(first.json);
});

test('the same key with a different body answers 422 and creates nothing', async () => {
  const base = await listen(createApp());
  await post(base, { title: L.dentist }, 'key-3');
  const reused = await post(base, { title: L.wardrobe }, 'key-3');
  expect(reused.status, 'status of key-3 with another body').toBe(422);
  expect(reused.json?.error?.code, 'error code').toBe('IDEMPOTENCY_KEY_REUSED');
  expect(await count(base), 'tasks after the reused key').toBe(3);
});

test('without a key, or with different keys, every POST creates a task', async () => {
  const base = await listen(createApp());
  await post(base, { title: L.dentist });
  await post(base, { title: L.dentist });
  await post(base, { title: L.dentist }, 'key-4');
  await post(base, { title: L.dentist }, 'key-5');
  expect(await count(base), 'tasks after two keyless POSTs and two different keys').toBe(6);
});
