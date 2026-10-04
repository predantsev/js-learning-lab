// A smoke test for CI: your app over a fresh ledger on a free port, three real requests.
// Exit code 1 if an answer is not what the contract says.
import { DatabaseSync } from 'node:sqlite';
import { createApp } from './app.js';
import { freshLedger } from './expenses-db.js';

const db = new DatabaseSync(freshLedger('smoke'));
const server = createApp({ db });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const checks = [
  ['/api/summary?month=2026-03', 200],
  ['/api/summary?month=2026-13', 400],
  ['/summary/2026-03', 200],
];
let failed = 0;
try {
  for (const [path, expected] of checks) {
    const response = await fetch(base + path, { signal: AbortSignal.timeout(2000) });
    const ok = response.status === expected;
    if (!ok) failed += 1;
    console.log(`${ok ? '✓' : '✗'} GET ${path} → ${response.status} (expected ${expected})`);
  }
} finally {
  server.closeAllConnections();
  server.close();
  db.close();
}
process.exitCode = failed === 0 ? 0 : 1;
