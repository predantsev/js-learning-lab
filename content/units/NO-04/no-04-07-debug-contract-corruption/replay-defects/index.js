// Replays the requests from the bug reports against a fresh server and prints every answer.
import { createApp } from './app.js';

const key = 'retry-7f3a';
const calls = [
  ['PATCH', '/records/w-02', { price: '45', name: null }],
  ['GET', '/records/w-02'],
  ['GET', '/records?sort=name'],
  ['POST', '/records', { name: '%%mug%%', price: 18 }, key],
  ['POST', '/records', { name: '%%mug%%', price: 18 }, key], // the app retried after a timeout
  ['GET', '/records'],
];

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const [method, path, body, idempotencyKey] of calls) {
    const response = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json', ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(2000), // never wait longer than 2 s
    });
    const text = await response.text();
    console.log(`${method} ${path} → ${response.status} ${text.length > 160 ? `${text.slice(0, 160)}…` : text}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
