// Triggers four failures of the habits API and prints what a client receives for each.
import { createApp } from './app.js';

const calls = [
  ['POST', '/habits', { name: '' }],
  ['GET', '/habits/h-09/last-done'],
  ['POST', '/habits', { name: '%%exercise%%' }],
  ['GET', '/habits/h-06/last-done'],
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
    // Long bodies are cut so the console stays readable.
    console.log(`${method} ${path} → ${response.status} ${text.length > 150 ? `${text.slice(0, 150)}…` : text}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
