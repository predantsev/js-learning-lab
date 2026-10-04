// For your own terminal. `node profile-lab.mjs` serves the wishlist on http://127.0.0.1:7330 until
// Ctrl+C; `node profile-lab.mjs --load` sends 300 requests to itself, prints p50/p95 and exits
// (so that `node --cpu-prof profile-lab.mjs --load` writes its profile when the process ends).
import { writeFile } from 'node:fs/promises';
import { createService } from './service.js';
import { makeWishes } from './wishes.js';

const port = Number(process.env.PORT ?? 7330);
await writeFile('settings.json', JSON.stringify({ pageSize: 20 }));
const server = createService(makeWishes(5_000), 'settings.json');
await new Promise((resolve) => server.listen(process.argv.includes('--load') ? 0 : port, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

if (!process.argv.includes('--load')) {
  console.log(`Wishlist service on ${base}/records?sort=name — stop it with Ctrl+C.`);
  process.on('SIGINT', () => server.close(() => console.log('Server closed.')));
} else {
  const durations = [];
  for (let i = 0; i < 300; i++) {
    const started = performance.now();
    await (await fetch(`${base}/records?sort=name&limit=20`)).json();
    durations.push(performance.now() - started);
  }
  const sorted = durations.toSorted((a, b) => a - b);
  const at = (p) => sorted[Math.ceil((p / 100) * sorted.length) - 1].toFixed(1);
  console.log(`300 requests: p50 ${at(50)} ms, p95 ${at(95)} ms`);
  server.closeAllConnections();
  server.close();
}
