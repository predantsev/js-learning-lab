// Triggers the four failures of the expenses API and prints status and body of each.
import { createApp } from './app.js';

const calls = [
  ['POST', '/expenses', { id: 'e-07', amountMinor: -500 }],
  ['GET', '/expenses/e-99'],
  ['POST', '/expenses', { id: 'e-01', label: '%%groceries%%', amountMinor: 84550 }],
  ['GET', '/expenses/e-03/receipt'],
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
    console.log(`${method} ${path} → ${response.status} ${text.length > 150 ? `${text.slice(0, 150)}…` : text}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
