// A demo (read-only): starts the server, checks health, sends a slow PATCH and a SIGTERM meanwhile.
// `exit` only prints here; in production it is process.exit.
import { startServer } from './app.js';
import { createDemoStore } from './store.js';

const { url } = await startServer(
  { port: 0, host: '127.0.0.1', store: createDemoStore(), deadlineMs: 2000 },
  { exit: (code) => console.log(`exit(${code})`), log: (line) => console.log(`log: ${line}`) },
);
const get = (path) => fetch(url + path, { signal: AbortSignal.timeout(1000) }).then((r) => r.status, (e) => e.cause?.code ?? e.name);
console.log('/livez', await get('/livez'), '/readyz', await get('/readyz'));
await new Promise((resolve) => setTimeout(resolve, 150));
console.log('/readyz %%later%%', await get('/readyz'));

const patch = fetch(`${url}/expenses/e-03`, { method: 'PATCH', body: JSON.stringify({ amountMinor: 16000 }), signal: AbortSignal.timeout(3000) })
  .then((r) => r.status, (e) => e.cause?.code ?? e.name);
await new Promise((resolve) => setTimeout(resolve, 50));
process.emit('SIGTERM', 'SIGTERM');
console.log('PATCH', await patch);
