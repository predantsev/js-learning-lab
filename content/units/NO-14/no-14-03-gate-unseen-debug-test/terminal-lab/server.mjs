// The book-club lab as a real process: node server.mjs [--fresh]
// Serves the club over the SQLite file club.db on 127.0.0.1 (port 7360, or PORT). --fresh writes the
// fixtures again; without it an existing club.db is kept. Ctrl+C stops the server.
import { existsSync } from 'node:fs';
import { createApp } from './app.js';
import { freshClub } from './club-data.js';
import { openClub } from './repo.js';

const port = Number(process.env.PORT ?? 7360);
if (process.argv.includes('--fresh') || !existsSync('club.db')) freshClub('club');
const club = openClub('club.db');
const server = createApp(club);
const time = () => new Date().toISOString().slice(11, 23);
server.on('request', (request, response) => {
  response.on('finish', () => console.log(`${time()} ${request.method} ${request.url} → ${response.statusCode}`));
});
server.listen(port, '127.0.0.1', () => console.log(`club lab listening on http://127.0.0.1:${port}`));
process.on('SIGINT', () => {
  server.close();
  club.close();
  console.log('club lab stopped');
  process.exit(0);
});
