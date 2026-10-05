// Real-HTTP tests of the expenses API with Node.js's built-in test runner, node:test.
// Running this file with `node index.js` runs the tests and prints the report.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createApp } from './app.js';

// Every test gets its own data folder and its own server on a free port (port 0).
async function startServer(t) {
  const dataDir = await mkdtemp(path.join(process.cwd(), 'test-data-'));
  const server = createApp({ dataDir });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.close();
    await rm(dataDir, { recursive: true, force: true });
  });
  return { base: `http://127.0.0.1:${server.address().port}`, dataDir };
}

const post = (base, body) => fetch(`${base}/expenses`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: typeof body === 'string' ? body : JSON.stringify(body),
  signal: AbortSignal.timeout(2000),
});

test('POST /expenses answers 201 with JSON and stores the expense on disk', async (t) => {
  const { base, dataDir } = await startServer(t);
  const response = await post(base, { id: 'e-06', label: '%%lunch%%', amountMinor: 21050 });
  assert.equal(response.status, 201);
  assert.match(response.headers.get('content-type'), /^application\/json/);
  const stored = JSON.parse(await readFile(path.join(dataDir, 'e-06.json'), 'utf8'));
  assert.deepEqual(stored, { id: 'e-06', label: '%%lunch%%', amountMinor: 21050 });
});

test('a body over 1024 bytes answers 413', async (t) => {
  const { base } = await startServer(t);
  const response = await post(base, { id: 'e-07', label: 'x'.repeat(2000), amountMinor: 100 });
  assert.equal(response.status, 413);
});

test('an id that is not e-<digits> answers 400 and stores nothing', async (t) => {
  const { base, dataDir } = await startServer(t);
  const response = await post(base, { id: '../secret', label: '%%lunch%%', amountMinor: 100 });
  assert.equal(response.status, 400);
  await assert.rejects(readFile(path.join(dataDir, '..', 'secret.json')), { code: 'ENOENT' });
});
