// Integration tests of the planner: the real API server, the web adapter and the shared data layer.
import { test, unperformed, expect } from './testing.js';
import { startServer, freshDataFile, createMemoryStorage, createWebAdapter, createDataLayer, countDue } from './system.js';

// A client "page load": a new data layer over a web adapter. Pass the same storage to model a reload.
const openClient = (server, storage, online = true) => createDataLayer(createWebAdapter({ baseUrl: server.base, storage, online }));

test('a record created before a server restart is loaded from the server after it', async () => {
  const dataFile = freshDataFile();
  const storage = createMemoryStorage();
  let server = await startServer({ dataFile });
  try {
    const created = await openClient(server, storage).createRecord({ title: 'Renew passport', dueDate: '2026-03-01' });
    await server.stop();
    server = await startServer({ dataFile });
    const { records, stale, failure } = await openClient(server, createMemoryStorage()).listRecords();
    expect(stale).toBe(false);
    expect(failure).toBeNull();
    expect(records.map((task) => task.id)).toContain(created.id);
  } finally {
    await server.stop();
  }
});

test('after a reload the server state wins over the saved copy', async () => {
  const server = await startServer({ dataFile: freshDataFile() });
  const storage = createMemoryStorage();
  try {
    expect(countDue((await openClient(server, storage).listRecords()).records, '2026-03-02')).toBe(2);
    // Another client changes the server while this one keeps its saved copy.
    await openClient(server, createMemoryStorage()).updateRecord('t-02', { done: true });
    const { records, stale } = await openClient(server, storage).listRecords();
    expect(stale).toBe(false);
    expect(records.find((task) => task.id === 't-02').done).toBe(true);
    expect(countDue(records, '2026-03-02')).toBe(1);
  } finally {
    await server.stop();
  }
});

test('offline keeps the saved copy, marked stale', async () => {
  const server = await startServer({ dataFile: freshDataFile() });
  const storage = createMemoryStorage();
  try {
    const fresh = await openClient(server, storage).listRecords();
    const offline = await openClient(server, storage, false).listRecords();
    expect(offline.stale).toBe(true);
    expect(offline.failure).toBe('offline');
    expect(offline.records).toEqual(fresh.records);
  } finally {
    await server.stop();
  }
});

test('a 500 keeps the saved copy, marked stale with failure http', async () => {
  const server = await startServer({ dataFile: freshDataFile() });
  const storage = createMemoryStorage();
  try {
    const fresh = await openClient(server, storage).listRecords();
    server.failNext(1, 500);
    const failed = await openClient(server, storage).listRecords();
    expect(failed.stale).toBe(true);
    expect(failed.failure).toBe('http');
    expect(failed.records).toEqual(fresh.records);
  } finally {
    await server.stop();
  }
});

unperformed('native companion: the same flow on a device', 'no emulator or device on this machine');
