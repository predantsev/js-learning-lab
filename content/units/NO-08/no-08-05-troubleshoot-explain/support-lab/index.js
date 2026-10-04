// Run here: the server code in this process on a free port, and the two tickets replayed.
// (The platform cannot keep a server running in the background; your terminal can.)
import { writeFileSync } from 'node:fs';
import { createApp } from './app.js';
import { seedExpenses } from './expenses.js';
import { openRepository } from './repo.js';
import { list, metrics, one, save } from './support-client.mjs';

writeFileSync('expenses-lab.json', JSON.stringify({ schemaVersion: 1, records: seedExpenses() }));
const server = createApp(openRepository('expenses-lab.json'), (line) => console.log(`server: ${line}`));
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  console.log(`$ node support-client.mjs list\n${await list(base)}`);
  console.log(`$ node support-client.mjs one\n${await one(base)}`);
  console.log(`$ node support-client.mjs save\n${await save(base)}`);
  console.log(`$ node support-client.mjs metrics\n${await metrics(base)}`);
} finally {
  server.closeAllConnections();
  server.close();
}
