import { createApp } from './app.js';
import { createRepository } from './repository.js';

// Every request gives up after 1 s, so a route that never answers fails its own check quickly.
async function send(method, path, body) {
  const repository = createRepository();
  await sleep(0); // the repository has loaded, as it would long before a real request
  const base = await listen(createApp(repository));
  try {
    return await request(base + path, { method, body, signal: AbortSignal.timeout(1000) });
  } catch (error) {
    return { status: `no answer within 1 s (${error.name})`, headers: {}, json: undefined };
  }
}

test('GET /records still answers 200 with the expenses', async () => {
  const response = await send('GET', '/records');
  expect(response.status, 'status of GET /records').toBe(200);
  expect(response.json?.map((e) => e.id), 'ids in GET /records').toEqual(['e-01', 'e-02', 'e-03']);
});

test('a missing expense answers 404', async () => {
  const response = await send('GET', '/records/e-99');
  expect(response.status, 'status of GET /records/e-99').toBe(404);
});

test('an invalid expense answers 400', async () => {
  const fraction = await send('POST', '/records', { label: L.expense4, amountMinor: 12.5 });
  expect(fraction.status, 'status of POST /records with amountMinor 12.5').toBe(400);
  const empty = await send('POST', '/records', { label: '  ', amountMinor: 9990 });
  expect(empty.status, 'status of POST /records with an empty label').toBe(400);
});

test('a valid expense still answers 201', async () => {
  const response = await send('POST', '/records', { label: L.expense4, amountMinor: 9990 });
  expect(response.status, 'status of POST /records with a valid expense').toBe(201);
});

test('another method on /records answers 405 with Allow', async () => {
  const response = await send('DELETE', '/records');
  expect(response.status, 'status of DELETE /records').toBe(405);
  expect(response.headers.allow ?? '(no Allow header)', 'Allow header of DELETE /records').toMatch(/GET/);
});

test('GET /totals answers 200 with the totals', async () => {
  const response = await send('GET', '/totals');
  expect(response.status, 'status of GET /totals').toBe(200);
  expect(response.json, 'body of GET /totals').toEqual({ count: 3, totalMinor: 84550 + 52000 + 18000 });
});

test('every error answer is JSON', async () => {
  for (const [method, path, body] of [['GET', '/records/e-99'], ['POST', '/records', { label: '' }], ['DELETE', '/records']]) {
    const response = await send(method, path, body);
    if (typeof response.status !== 'number') continue; // a route that never answers fails its own check
    expect(response.headers['content-type'] ?? '(no Content-Type)', `Content-Type of ${method} ${path}`).toMatch(/^application\/json/);
    expect(response.json, `body of ${method} ${path} parsed as JSON`).toBeDefined();
  }
});
