// The expense lab's server for your terminal: node server.mjs [--fresh]
// Data in expenses-lab.json (written from the seed when missing, or with --fresh); 127.0.0.1, port
// from PORT (7341 by default). Every log line goes to the terminal and to server.log. Ctrl+C stops it.
import { appendFileSync, existsSync, writeFileSync } from 'node:fs';
import { createApp } from './app.js';
import { seedExpenses } from './expenses.js';
import { openRepository } from './repo.js';

const FILE = 'expenses-lab.json';
if (process.argv.includes('--fresh') || !existsSync(FILE)) {
  writeFileSync(FILE, JSON.stringify({ schemaVersion: 1, records: seedExpenses() }));
}
const log = (line) => {
  console.log(line);
  appendFileSync('server.log', `${line}\n`);
};
const port = Number(process.env.PORT ?? 7341);
const server = createApp(openRepository(FILE), log);
server.listen(port, '127.0.0.1', () => console.log(`expense lab listening on http://127.0.0.1:${port}`));
process.on('SIGINT', () => {
  server.closeAllConnections();
  server.close(() => console.log('expense lab stopped'));
});
