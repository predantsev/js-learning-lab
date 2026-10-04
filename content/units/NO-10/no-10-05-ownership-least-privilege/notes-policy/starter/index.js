// Sends the same few requests as three users and prints each status.
import { createApp } from './app.js';

const calls = [
  ['lab-token-u02', 'GET', '/notes'],
  ['lab-token-u02', 'GET', '/notes/n-1'],
  ['lab-token-u02', 'PATCH', '/notes/n-1'],
  ['lab-token-u02', 'GET', '/notes/n-3'],
  ['lab-token-admin', 'PATCH', '/notes/n-4'],
  ['lab-token-admin', 'DELETE', '/notes/n-4'],
  ['lab-token-u01', 'PATCH', '/notes/n-3'],
];

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const [token, method, path] of calls) {
    const response = await fetch(base + path, {
      method,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: method === 'PATCH' ? JSON.stringify({ title: '%%renamed%%' }) : undefined,
      signal: AbortSignal.timeout(2000),
    });
    const body = await response.text();
    const shown = path === '/notes' && response.ok ? JSON.parse(body).map((note) => note.id).join(', ') : body;
    console.log(`${token.replace('lab-token-', '')} ${method} ${path} → ${response.status} ${shown}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
