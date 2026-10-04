// The monthly summary as a real process: node server.mjs [--fresh]
// Serves your app.js over the SQLite file ledger.db on 127.0.0.1 (port 7362, or PORT) and prints one
// JSON log line per response. --fresh writes the fixtures again. Ctrl+C stops the server.
import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from './app.js';
import { freshLedger } from './expenses-db.js';

const port = Number(process.env.PORT ?? 7362);
if (process.argv.includes('--fresh') || !existsSync('ledger.db')) freshLedger('ledger');
const db = new DatabaseSync('ledger.db');
const server = createApp({ db, log: (entry) => console.log(JSON.stringify({ time: new Date().toISOString(), ...entry })) });
server.listen(port, '127.0.0.1', () => console.log(`summary lab listening on http://127.0.0.1:${port}`));
process.on('SIGINT', () => {
  server.close();
  db.close();
  console.log('summary lab stopped');
  process.exit(0);
});
