// Starts your feature over a fresh ledger, sends a few requests, prints the answers and the log,
// then runs your summary.test.js (read-only).
import { DatabaseSync } from 'node:sqlite';
import { createApp } from './app.js';
import { freshLedger } from './expenses-db.js';
import { run } from './testing.js';

const db = new DatabaseSync(freshLedger('demo'));
const server = createApp({ db, log: (entry) => console.log('log', JSON.stringify(entry)) });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const path of ['/api/summary?month=2026-03', '/api/summary?month=2026-13', '/summary/2026-03']) {
    const response = await fetch(base + path, { headers: { 'x-request-id': 'demo-1' }, signal: AbortSignal.timeout(2000) });
    const text = await response.text();
    console.log(`GET ${path} → ${response.status} ${text.length > 160 ? `${text.slice(0, 160)}…` : text}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
  db.close();
}

console.log('— summary.test.js —');
await import('./summary.test.js');
await run();
