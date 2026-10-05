// Two tests of GET /habits with node:test, over real HTTP on a free loopback port.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createApp } from './app.js';
import { habitSummarySchema, schemaErrors } from './contract.js';

let server;
let base;
before(async () => {
  server = createApp();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

test('GET /habits answers 200', async () => {
  const response = await fetch(`${base}/habits`, { signal: AbortSignal.timeout(2000) });
  assert.equal(response.status, 200);
});

test('GET /habits keeps the contract', async () => {
  const response = await fetch(`${base}/habits`, { signal: AbortSignal.timeout(2000) });
  assert.equal(response.status, 200);
  assert.deepEqual(schemaErrors(await response.json(), habitSummarySchema), []);
});
