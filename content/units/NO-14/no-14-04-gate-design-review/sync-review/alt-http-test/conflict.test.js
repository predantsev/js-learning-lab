// Your test for the requirement the PR misses — here over real HTTP: two devices send POST /sync.
import { test, expect } from './testing.js';
import { createServer } from './server.js';
import { createStore } from './tasks-store.js';

test('over HTTP, a fast-clock laptop does not overwrite the phone’s newer edit', async () => {
  const store = createStore([{ id: 't-08', title: 'Plan', dueDate: null, done: false, version: 1, editedAt: '2026-05-04T08:00:00Z' }]);
  const server = createServer(store);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const sync = (deviceId, change) => fetch(`${base}/sync`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ deviceId, changes: [change] }), signal: AbortSignal.timeout(2000) });
  try {
    await sync('phone', { changeId: 'p-1', taskId: 't-08', baseVersion: 1, editedAt: '2026-05-04T10:00:00Z', fields: { title: 'phone title' } });
    await sync('laptop', { changeId: 'l-1', taskId: 't-08', baseVersion: 1, editedAt: '2026-05-04T10:30:00Z', fields: { title: 'laptop title' } });
    const tasks = await (await fetch(`${base}/tasks`, { signal: AbortSignal.timeout(2000) })).json();
    expect(tasks.find((task) => task.id === 't-08').title, 'title after both devices synced').toBe('phone title');
  } finally {
    server.closeAllConnections();
    server.close();
  }
});
