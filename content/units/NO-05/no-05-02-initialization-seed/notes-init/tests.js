import http from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { initStore, startServer } from './init.js';

const fixtures = [
  { id: 'n-01', title: L.welcome, body: L.welcomeBody, pinned: true },
  { id: 'n-02', title: L.ideas, body: '', pinned: false },
];
let cases = 0;

// A store path in a fresh folder that already exists (except where a test says otherwise).
async function freshFile() {
  const dir = tmp(`case-${++cases}`);
  await mkdir(dir, { recursive: true });
  return path.join(dir, 'notes.json');
}

const guard = () => {
  expect(typeof initStore, 'type of initStore').toBe('function');
  expect(typeof startServer, 'type of startServer').toBe('function');
};

async function rejects(promise) {
  try {
    await promise;
    return false;
  } catch {
    return true;
  }
}

test('a missing store is created, folder included, with the fixtures', async () => {
  guard();
  const file = path.join(tmp(`missing-${++cases}`), 'nested', 'data', 'notes.json');
  await initStore(file, fixtures);
  expect(JSON.parse(await readFile(file, 'utf8')), 'the store file after initStore').toEqual({ schemaVersion: 1, records: fixtures });
});

test('a store that has notes is left unchanged', async () => {
  guard();
  const file = await freshFile();
  const own = JSON.stringify({ schemaVersion: 1, records: [{ id: 'n-07', title: L.own, body: '', pinned: false }] });
  await writeFile(file, own);
  await initStore(file, fixtures);
  expect(await readFile(file, 'utf8'), 'the store file after initStore').toBe(own);
});

test('an empty store is seeded', async () => {
  guard();
  const file = await freshFile();
  await writeFile(file, JSON.stringify({ schemaVersion: 1, records: [] }));
  await initStore(file, fixtures);
  expect(JSON.parse(await readFile(file, 'utf8')).records, 'records after initStore').toEqual(fixtures);
});

test('running initStore twice gives the same file as running it once', async () => {
  guard();
  const file = await freshFile();
  await initStore(file, fixtures);
  const once = await readFile(file, 'utf8');
  await initStore(file, fixtures);
  expect(await readFile(file, 'utf8'), 'the store file after the second initStore').toBe(once);
  expect(JSON.parse(once).records, 'records after the first initStore').toEqual(fixtures);
});

test('a store of another schemaVersion is refused and kept', async () => {
  guard();
  const file = await freshFile();
  const newer = JSON.stringify({ schemaVersion: 2, records: [] });
  await writeFile(file, newer);
  expect(await rejects(initStore(file, fixtures)), 'initStore rejects for schemaVersion 2').toBe(true);
  expect(await readFile(file, 'utf8'), 'the store file afterwards').toBe(newer);
});

test('a store that cannot be parsed is refused and kept', async () => {
  guard();
  const file = await freshFile();
  const torn = '{"schemaVersion":1,"records":[{"id":"n-0';
  await writeFile(file, torn);
  expect(await rejects(initStore(file, fixtures)), 'initStore rejects for broken JSON').toBe(true);
  expect(await readFile(file, 'utf8'), 'the store file afterwards').toBe(torn);
});

test('startServer finishes initStore before it listens', async () => {
  guard();
  const file = await freshFile();
  const realListen = http.Server.prototype.listen;
  let atListen = 'listen() was never called';
  http.Server.prototype.listen = function listen(...args) {
    atListen = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).records.length : 'no store file yet';
    return realListen.apply(this, args);
  };
  let server;
  try {
    server = await startServer(file, fixtures);
  } finally {
    http.Server.prototype.listen = realListen;
    server?.close();
  }
  expect(atListen, 'records in the store at the moment listen() was called').toBe(fixtures.length);
});

test('GET /notes answers the seeded notes right after startServer', async () => {
  guard();
  const file = await freshFile();
  const server = await startServer(file, fixtures);
  try {
    expect(server?.address?.()?.address, 'address the server listens on').toBe('127.0.0.1');
    const response = await request(`http://127.0.0.1:${server.address().port}/notes`, { signal: AbortSignal.timeout(2000) });
    expect(response.status, 'status of GET /notes').toBe(200);
    expect(response.json, 'body of GET /notes').toEqual(fixtures);
  } finally {
    server?.closeAllConnections?.();
    server?.close?.();
  }
});
