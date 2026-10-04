// Integration tests of the planner, written around one helper that starts and stops a server.
import { test, unperformed, expect } from './testing.js';
import { startServer, freshDataFile, createMemoryStorage, createWebAdapter, createDataLayer, countDue } from './system.js';

async function withServer(dataFile, body) {
  const server = await startServer({ dataFile });
  try {
    return await body(server);
  } finally {
    await server.stop();
  }
}
const client = (server, storage, online) => createDataLayer(createWebAdapter({ baseUrl: server.base, storage, online }));

test('restart: the server still has the new task and the due count comes from it', async () => {
  const dataFile = freshDataFile();
  const created = await withServer(dataFile, (server) => client(server, createMemoryStorage()).createRecord({ title: 'Call the plumber', dueDate: '2026-02-28' }));
  const after = await withServer(dataFile, (server) => client(server, createMemoryStorage()).listRecords());
  expect(after.stale).toBeFalsy();
  expect(after.records.some((task) => task.id === created.id && task.title === 'Call the plumber')).toBe(true);
  expect(countDue(after.records, '2026-02-28')).toBe(1);
});

test('reload with the same storage shows what the server has now', async () => {
  await withServer(freshDataFile(), async (server) => {
    const storage = createMemoryStorage();
    await client(server, storage).listRecords();
    await fetch(`${server.base}/v1/records/t-01`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: '{"done":true}' });
    const reloaded = await client(server, storage).listRecords();
    expect(reloaded.records.find((task) => task.id === 't-01').done).toBe(true);
  });
});

test('no network: the last list is still shown, as stale', async () => {
  await withServer(freshDataFile(), async (server) => {
    const storage = createMemoryStorage();
    const first = await client(server, storage).listRecords();
    const offline = await client(server, storage, false).listRecords();
    expect(offline.records).toHaveLength(first.records.length);
    expect(offline.records.length).toBeGreaterThan(0);
    expect([offline.stale, offline.failure]).toEqual([true, 'offline']);
  });
});

test('server error: the last list is still shown, as stale', async () => {
  await withServer(freshDataFile(), async (server) => {
    const storage = createMemoryStorage();
    await client(server, storage).listRecords();
    server.failNext(1, 503);
    const broken = await client(server, storage).listRecords();
    expect([broken.stale, broken.failure, broken.records.length]).toEqual([true, 'http', 3]);
  });
});

unperformed('native: integration on the emulator', 'native tooling is not installed');
