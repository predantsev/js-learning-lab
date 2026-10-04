// Reads two pages of open tasks while another client adds a task in between — by offset, then by cursor.
import { createApp } from './app.js';

async function twoPages(strategy) {
  const server = createApp();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const get = async (path) => (await fetch(base + path, { signal: AbortSignal.timeout(2000) })).json();
  const ids = (page) => page.items.map((task) => `${task.id} ${task.dueDate.slice(5)}`).join(', ');
  try {
    const first = await get(strategy === 'offset' ? '/tasks?limit=4&offset=0' : '/tasks?limit=4');
    console.log(`${strategy} · %%page%% 1: ${ids(first)}`);
    // Another client adds a task due on 2 March while we are reading.
    await fetch(`${base}/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 't-13', title: '%%t13%%', dueDate: '2026-03-02' }),
      signal: AbortSignal.timeout(2000),
    });
    const second = await get(strategy === 'offset' ? '/tasks?limit=4&offset=4' : `/tasks?limit=4&cursor=${first.nextCursor}`);
    console.log(`${strategy} · %%page%% 2: ${ids(second)}`);
  } finally {
    server.closeAllConnections();
    server.close();
  }
}

await twoPages('offset');
await twoPages('cursor');
