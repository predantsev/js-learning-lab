// A slow PATCH is in flight when the process receives SIGTERM. The handler stops new connections,
// lets the PATCH finish, flushes the store and only then lets the process end.
import { readFile } from 'node:fs/promises';
import { createServer } from './server.js';
import { createStore } from './store.js';

const log = (line) => console.log(`[${String(Math.round(performance.now())).padStart(5)} ms] ${line}`);
const store = createStore([{ id: 'e-01', label: '%%groceries%%', amountMinor: 84550, category: 'food' }]);
const server = createServer(store, log);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

process.on('SIGTERM', () => {
  log('SIGTERM %%received%%');
  server.close(async () => {
    await store.flush();
    log(`%%flushed%% expenses.json: ${await readFile('expenses.json', 'utf8')}`);
    process.exitCode = 0;
  });
});

const patch = fetch(`${base}/expenses/e-01`, { method: 'PATCH', body: JSON.stringify({ amountMinor: 79000 }), signal: AbortSignal.timeout(3000) })
  .then((response) => `${response.status}`, (error) => `${error.name}: ${error.cause?.code ?? error.message}`);
await new Promise((resolve) => setTimeout(resolve, 100));
process.kill(process.pid, 'SIGTERM'); // the signal a process manager sends to stop this process
await new Promise((resolve) => setTimeout(resolve, 50));

const late = await fetch(`${base}/expenses`, { signal: AbortSignal.timeout(1000) })
  .then((response) => `${response.status}`, (error) => `${error.name}: ${error.cause?.code ?? error.message}`);
log(`%%newRequest%% GET /expenses: ${late}`);
log(`%%inFlight%% PATCH: ${await patch}`);
