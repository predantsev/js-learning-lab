// Misconception: ids come from our own client, so a test for a crafted id is unnecessary.
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { test } from './testing.js';
import { createApp } from './app.js';

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

const post = (base, body) => fetch(`${base}/records`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
  signal: AbortSignal.timeout(2000),
});

test('a valid record answers 201 and lands on disk', async (t) => {
  const { base, dataDir } = await startServer(t);
  const response = await post(base, { id: 'w-07', name: '%%lamp%%', price: 45 });
  assert.equal(response.status, 201);
  const stored = JSON.parse(await readFile(path.join(dataDir, 'w-07.json'), 'utf8'));
  assert.deepEqual(stored, { id: 'w-07', name: '%%lamp%%', price: 45 });
});

test('a body over 1024 bytes answers 413', async (t) => {
  const { base } = await startServer(t);
  const response = await post(base, { id: 'w-08', name: 'x'.repeat(1100), price: 1 });
  assert.equal(response.status, 413);
});
