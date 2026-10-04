// Posts six bodies to the wishlist API, prints every answer, then the stored records.
import { createApp } from './app.js';

const bodies = [
  { name: '%%lamp%%', price: 45 },
  { price: 45 },
  { name: '%%lamp%%', price: '45' },
  { name: '%%lamp%%', isAdmin: true },
  { name: 'x'.repeat(300) },
  { name: '   ', price: '45', isAdmin: true },
];

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const [index, body] of bodies.entries()) {
    const response = await fetch(`${base}/records`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(2000), // never wait longer than 2 s
    });
    console.log(`#${index + 1} → ${response.status} ${await response.text()}`);
  }
  const stored = await fetch(`${base}/records`, { signal: AbortSignal.timeout(2000) });
  console.log(`%%stored%% ${await stored.text()}`);
} finally {
  server.closeAllConnections();
  server.close();
}
