// Starts the notes API on a free loopback port, sends one request per operation and stops it.
import { createApp } from './app.js';

const calls = [
  ['GET', '/notes'],
  ['GET', '/notes/n-1'],
  ['POST', '/notes', { title: '%%newTitle%%' }],
  ['PUT', '/notes/n-1', { title: '%%renamed%%' }],
  ['PATCH', '/notes/n-2', { pinned: false }],
  ['DELETE', '/notes/n-2'],
  ['DELETE', '/notes/n-2'],
];

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const [method, path, body] of calls) {
    const response = await fetch(base + path, {
      method,
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(2000), // never wait longer than 2 s
    });
    const text = await response.text();
    console.log(`${method} ${path} → ${response.status} ${text === '' ? '(%%noBody%%)' : text}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
