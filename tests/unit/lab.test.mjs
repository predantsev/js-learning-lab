// Lab HTTP fixtures: open to every web page by design (no token, CORS *), so their memory must stay
// bounded. Security review #7: before the limits, 300 cross-origin "simple" POSTs of 200 KB were all
// accepted and grew the server by about 150 MB.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { LAB_LIMITS } from '../../server/lab.mjs';
import { rawRequest, startTestServer } from './helpers.mjs';

let ctx;
let port;
before(async () => {
  ctx = await startTestServer();
  port = ctx.server.port;
});
after(async () => {
  await ctx?.close();
});

// What any web page can send without a CORS preflight: a text/plain POST from its own origin.
const fromWebPage = (method, route, body) => rawRequest(port, { method, path: route, headers: { host: `localhost:${port}`, origin: 'https://evil.example', 'content-type': 'text/plain' }, body });
const reset = () => fromWebPage('POST', '/lab/reset', '');

test('records written through the lab are capped in bytes; DELETE and reset free the room', async () => {
  await reset();
  const big = JSON.stringify({ note: 'x'.repeat(200 * 1024) });
  const statuses = [];
  let full = null;
  for (let i = 0; i < 100 && full === null; i++) {
    const r = await fromWebPage('POST', '/lab/wishlist/items', big);
    statuses.push(r.status);
    if (r.status === 507) full = r;
  }
  assert.ok(full, `expected 507 lab-full within 100 posts, got ${statuses.length} × ${[...new Set(statuses)]}`);
  assert.equal(JSON.parse(full.text).error, 'lab-full');
  assert.equal(full.headers['access-control-allow-origin'], '*', 'learner code can read why the write failed');
  assert.ok(ctx.server.lab.stats().storedBytes <= LAB_LIMITS.storedBytes);

  // PATCH merges cannot grow a record past the limit either.
  const created = JSON.parse((await fromWebPage('GET', '/lab/wishlist/items?limit=1000')).text).items.filter((r) => typeof r.id === 'string' && r.id.startsWith('lab-'));
  const patched = await fromWebPage('PATCH', `/lab/wishlist/items/${encodeURIComponent(created[0].id)}`, JSON.stringify({ more: 'y'.repeat(200 * 1024) }));
  assert.equal(patched.status, 507);

  assert.equal((await fromWebPage('DELETE', `/lab/wishlist/items/${encodeURIComponent(created[0].id)}`)).status, 204);
  assert.equal((await fromWebPage('POST', '/lab/wishlist/items', big)).status, 201, 'a deleted record frees its bytes');

  assert.equal((await reset()).status, 200);
  assert.equal(ctx.server.lab.stats().storedBytes, 0);
  assert.equal((await fromWebPage('POST', '/lab/wishlist/items', big)).status, 201);
  await reset();
});

test('the number of collections is capped', async () => {
  await reset();
  const statuses = [];
  for (let i = 0; i < LAB_LIMITS.collections + 5; i++) statuses.push((await fromWebPage('GET', `/lab/ns${i}/items`)).status);
  assert.equal(statuses.filter((s) => s === 200).length, LAB_LIMITS.collections);
  assert.equal(statuses.at(-1), 507);
  assert.equal(ctx.server.lab.stats().collections, LAB_LIMITS.collections);
  await reset();
  assert.equal((await fromWebPage('GET', '/lab/wishlist/items')).status, 200);
});

test('retry counters stay bounded (oldest dropped)', async () => {
  await reset();
  for (let i = 0; i < LAB_LIMITS.counters + 50; i++) await fromWebPage('GET', `/lab/flaky?key=k${i}&fail=0`);
  assert.equal(ctx.server.lab.stats().counters, LAB_LIMITS.counters);
  await reset();
});

test('a malformed item id is a 400, not a server error', async () => {
  const r = await fromWebPage('GET', '/lab/wishlist/items/%E0%A4%A');
  assert.equal(r.status, 400);
  assert.equal(JSON.parse(r.text).error, 'bad-id');
});
