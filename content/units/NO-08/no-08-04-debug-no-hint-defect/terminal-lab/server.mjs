// The habit lab's server for your terminal: node server.mjs [--fresh]
// Keeps the habits in habits-lab.json (created from the fixtures when missing, or with --fresh),
// listens on 127.0.0.1 (port from PORT, 7340 by default), logs one line per request and closes on Ctrl+C.
import { existsSync } from 'node:fs';
import { createApp } from './app.js';
import { freshStore } from './lab.js';
import { openRepository } from './repo.js';

const FILE = 'habits-lab.json';
if (process.argv.includes('--fresh') || !existsSync(FILE)) await freshStore('habits-lab');
const port = Number(process.env.PORT ?? 7340);
const server = createApp(await openRepository(FILE), (line) => console.log(`${new Date().toISOString().slice(11, 23)} ${line}`));
server.listen(port, '127.0.0.1', () => console.log(`habit lab listening on http://127.0.0.1:${port}`));
process.on('SIGINT', () => {
  server.closeAllConnections();
  server.close(() => console.log('habit lab stopped'));
});
