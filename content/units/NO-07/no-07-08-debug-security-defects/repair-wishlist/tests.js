// Regression checks: one per defect, plus the happy path that must keep working.
import { createServer } from './server.js';

async function start() {
  expect(typeof createServer, 'type of createServer').toBe('function');
  const lines = [];
  const base = await listen(createServer({ log: (line) => lines.push(String(line)) }));
  const get = (path, headers = {}) => request(base + path, { headers, signal: AbortSignal.timeout(1500) });
  return { base, get, lines };
}

test('valid requests still work: filter, create, a dated snapshot and a log line', async () => {
  const { base, get, lines } = await start();
  const home = await get('/items?filter[category]=home');
  expect(home.status, 'status of GET /items?filter[category]=home').toBe(200);
  expect(home.json?.map((item) => item.id), 'ids in category home').toEqual(['w-02']);
  const created = await request(`${base}/items`, { method: 'POST', body: { name: L.mug, price: 18, category: 'home' } });
  expect(created.status, 'status of POST /items').toBe(201);
  const snapshot = await get('/snapshots/2026-03-01.json');
  expect(snapshot.status, 'status of GET /snapshots/2026-03-01.json').toBe(200);
  expect(snapshot.json?.length, 'items in the snapshot').toBe(2);
  expect(lines.some((line) => line.includes('GET') && line.includes('/items')), 'a log line names GET and /items').toBe(true);
});

test('a snapshot name cannot leave the snapshots folder', async () => {
  const { get } = await start();
  for (const name of ['....%2F%2Fsecret.json', '..%2Fsecret.json', '..%2F..%2Fdata%2Fsecret.json', '.....%2F%2F%2Fsecret.json']) {
    const response = await get(`/snapshots/${name}`);
    expect([400, 404].includes(response.status), `status for /snapshots/${name} is 400 or 404 (it was ${response.status})`).toBe(true);
    expect(response.text.includes('sessionSecret'), `the answer for /snapshots/${name} contains the secret`).toBe(false);
  }
});

test('the log never contains the authorization header', async () => {
  const { get, lines } = await start();
  await get('/items', { authorization: 'Bearer demo-session-7f3a' });
  await get('/items?filter[category]=tech', { authorization: 'Bearer demo-session-7f3a' });
  expect(lines.length > 0, 'the server writes log lines').toBe(true);
  expect(lines.filter((line) => line.includes('demo-session')), 'log lines with the token').toEqual([]);
});

test('an unexpected error answers 500 INTERNAL with no message and no stack', async () => {
  const { get } = await start();
  const response = await get('/items/w-99/price-per-month');
  expect(response.status, 'status of GET /items/w-99/price-per-month').toBe(500);
  expect(response.json?.error?.code, 'error code').toBe('INTERNAL');
  expect(/TypeError|Cannot read|\bat\s.+:\d+/.test(response.text), 'the answer shows the message or the stack').toBe(false);
});

test('a crafted query cannot change Object.prototype', async () => {
  const { get } = await start();
  try {
    await get('/items?__proto__[isAdmin]=true');
    expect({}.isAdmin, 'isAdmin of a brand-new empty object').toBe(undefined);
  } finally {
    delete Object.prototype.isAdmin; // clean up so other checks are not affected
  }
});
