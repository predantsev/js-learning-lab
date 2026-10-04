// The repaired server and data source, then your two tests against good and seeded servers.
import http from 'node:http';
import { createServer } from './server.js';
import { createDataSource } from './data-source.js';
import { contractTest, preflightTest } from './checks.js';
import { parseWishV1 } from './contract.js';

const DEV = 'http://127.0.0.1:5173';
const preflight = (base, origin) => request(`${base}/v1/records/w-01`, {
  method: 'OPTIONS',
  headers: { origin, 'access-control-request-method': 'PATCH', 'access-control-request-headers': 'content-type' },
});
const lower = (value) => String(value ?? '').toLowerCase();

// Small servers made here: a correct one and one with each seeded defect.
const good = [{ id: 'w-1', name: 'a', price: 10, acquired: false }, { id: 'w-2', name: 'b', price: null, acquired: true }];
function labServer({ body = good, allowHeaders = 'content-type', allowMethods = 'GET, PATCH' } = {}) {
  return http.createServer((req, res) => {
    if (req.headers.origin === DEV) res.setHeader('access-control-allow-origin', DEV);
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'access-control-allow-methods': allowMethods, 'access-control-allow-headers': allowHeaders });
      return res.end();
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  });
}
const renamed = good.map(({ price, ...rest }) => ({ ...rest, priceUah: price }));
const tests = () => {
  expect(typeof contractTest, 'type of contractTest').toBe('function');
  expect(typeof preflightTest, 'type of preflightTest').toBe('function');
};

test('the server allows the PATCH preflight with content-type from the dev origin', async () => {
  const response = await preflight(await listen(createServer()), DEV);
  expect(response.status, 'status of the preflight').toBe(204);
  expect(response.headers['access-control-allow-origin'], 'Access-Control-Allow-Origin').toBe(DEV);
  expect(lower(response.headers['access-control-allow-headers']), 'Access-Control-Allow-Headers').toContain('content-type');
});

test('another origin still gets no permission', async () => {
  const base = await listen(createServer());
  const other = await preflight(base, 'http://127.0.0.1:8080');
  expect(other.headers['access-control-allow-origin'], 'Access-Control-Allow-Origin for :8080').toBeUndefined();
  const get = await request(`${base}/v1/records`, { headers: { origin: 'http://127.0.0.1:8080' } });
  expect(get.headers['access-control-allow-origin'], 'Access-Control-Allow-Origin on GET for :8080').toBeUndefined();
});

test('/v1/records keeps the v1 shape', async () => {
  const response = await request(`${await listen(createServer())}/v1/records`);
  const problems = (response.json ?? []).flatMap((wish) => parseWishV1(wish));
  expect(response.status, 'status of GET /v1/records').toBe(200);
  expect(problems, 'problems of the wishes by contract v1').toEqual([]);
});

test('listRecords asks the server instead of returning fixtures', async () => {
  const base = await listen(createServer());
  const list = await createDataSource({ baseUrl: base }).listRecords();
  expect((list ?? []).map((wish) => wish.id), 'ids from listRecords').toEqual(['w-01', 'w-03', 'w-07']);
});

test('contractTest passes a correct server and catches a renamed field', async () => {
  tests();
  expect(await contractTest(await listen(labServer())), 'problems on a correct server').toEqual([]);
  expect((await contractTest(await listen(labServer({ body: renamed })))).length, 'problems when price became priceUah').toBeGreaterThan(0);
});

test('preflightTest passes a correct server and catches a missing content-type', async () => {
  tests();
  expect(await preflightTest(await listen(labServer()), DEV), 'problems on a correct server').toEqual([]);
  const missing = await preflightTest(await listen(labServer({ allowHeaders: 'idempotency-key' })), DEV);
  expect(missing.length, 'problems when Allow-Headers lacks content-type').toBeGreaterThan(0);
  const noPatch = await preflightTest(await listen(labServer({ allowMethods: 'GET' })), DEV);
  expect(noPatch.length, 'problems when Allow-Methods lacks PATCH').toBeGreaterThan(0);
});
