// Starts the notes API on a free loopback port, sends a few requests and stops it.
// Add your own requests here while you build; Check sends many more.
import { createApp } from './app.ts';

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const send = async (method, path, body) => {
  const response = await fetch(base + path, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(2000), // never wait longer than 2 s
  });
  const text = await response.text();
  console.log(`${method} ${path} → ${response.status} ${text.length > 140 ? `${text.slice(0, 140)}…` : text}`);
};
try {
  await send('GET', '/v1/notes?limit=3');
  await send('POST', '/v1/notes', { title: '%%newTitle%%' });
  await send('POST', '/v1/notes', '{"title": "unfinished');
  await send('GET', '/v2/notes/n-01');
} finally {
  server.closeAllConnections();
  server.close();
}
