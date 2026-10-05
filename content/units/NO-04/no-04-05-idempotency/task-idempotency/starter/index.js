// Sends the same create twice with one key, then reuses the key for another task, then counts the tasks.
import { createApp } from './app.js';

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const post = async (value, key) => {
  const response = await fetch(`${base}/tasks`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(key ? { 'idempotency-key': key } : {}) },
    body: JSON.stringify(value),
    signal: AbortSignal.timeout(2000), // never wait longer than 2 s
  });
  console.log(`POST ${key ?? '(%%noKey%%)'} → ${response.status} ${await response.text()}`);
};
try {
  await post({ title: '%%dentist%%' }, 'key-a');
  await post({ title: '%%dentist%%' }, 'key-a'); // a retry
  await post({ title: '%%wardrobe%%' }, 'key-a'); // the same key, another task
  const tasks = await (await fetch(`${base}/tasks`, { signal: AbortSignal.timeout(2000) })).json();
  console.log(`%%count%% ${tasks.length}`);
} finally {
  server.closeAllConnections();
  server.close();
}
