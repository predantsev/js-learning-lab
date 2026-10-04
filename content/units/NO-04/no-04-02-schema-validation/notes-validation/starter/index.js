// Sends a few creates and updates to the notes API, then prints what was stored.
import { createApp } from './app.js';

const calls = [
  ['POST', '/notes', { title: '  %%films%%  ' }],
  ['POST', '/notes', { title: 42, pinned: 'yes', color: 'red' }],
  ['PATCH', '/notes/n-1', { pinned: 'yes' }],
  ['PATCH', '/notes/n-2', { title: '  %%groceries%% ' }],
];

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const [method, path, body] of calls) {
    const response = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(2000), // never wait longer than 2 s
    });
    console.log(`${method} ${path} → ${response.status} ${await response.text()}`);
  }
  const stored = await fetch(`${base}/notes`, { signal: AbortSignal.timeout(2000) });
  console.log(`%%stored%% ${await stored.text()}`);
} finally {
  server.closeAllConnections();
  server.close();
}
