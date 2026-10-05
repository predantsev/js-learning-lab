// Sends 40 requests GET /records?sort=name&limit=20 to the wishlist service on loopback
// (after 5 warm-up requests) and prints p50 and p95 of their durations.
import { writeFile } from 'node:fs/promises';
import { createService } from './service.js';
import { makeWishes } from './wishes.js';

await writeFile('settings.json', JSON.stringify({ pageSize: 20 }));
const server = createService(makeWishes(5_000), 'settings.json');
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/records?sort=name&limit=20`;

async function timedRequest() {
  const started = performance.now();
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  await response.json();
  return performance.now() - started;
}

try {
  for (let i = 0; i < 5; i++) await timedRequest(); // warm-up: the first requests are also the cold ones
  const durations = [];
  for (let i = 0; i < 40; i++) durations.push(await timedRequest());
  const sorted = durations.toSorted((a, b) => a - b);
  const at = (p) => sorted[Math.ceil((p / 100) * sorted.length) - 1].toFixed(1);
  console.log(`GET /records?sort=name&limit=20 × 40: p50 ${at(50)} ms, p95 ${at(95)} ms`);
} finally {
  server.closeAllConnections();
  server.close();
}
