// Starts the wishlist API on a free loopback port, sends one request per operation and stops it.
import { createApp } from './app.js';

const calls = [
  ['GET', '/records'],
  ['GET', '/records/w-02'],
  ['POST', '/records', { name: '%%mug%%', price: 18 }],
  ['PUT', '/records/w-02', { name: '%%lamp%%', price: 50 }],
  ['PATCH', '/records/w-03', { acquired: true }],
  ['POST', '/deleteRecord?id=w-05'],
  ['GET', '/records/w-05'],
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
    let shown = text === '' ? '(%%noBody%%)' : text;
    if (text.startsWith('[')) shown = `%%listOf%% ${JSON.parse(text).length}`;
    console.log(`${method} ${path} → ${response.status} ${shown}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
