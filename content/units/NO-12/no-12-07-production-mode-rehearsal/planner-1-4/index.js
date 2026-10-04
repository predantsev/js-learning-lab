// A look at version 1.4.0 in the sandbox: the app with a temp data folder, its health routes before
// and during a shutdown, and /metrics after a few requests. server.ts (signals, listen on 7330) and
// upgrade-lab-1.4.mjs run only in your terminal: the sandbox does not start git or keep a port open.
import { createApp } from './src/app.ts';
import { openStore } from './src/store.ts';

const health = { shuttingDown: false };
const server = createApp(await openStore(`${process.cwd()}/lab-data`), health);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const status = async (path, init) => (await fetch(base + path, { ...init, signal: AbortSignal.timeout(2000) })).status;
try {
  console.log('/livez', await status('/livez'), '/readyz', await status('/readyz'));
  await status('/tasks');
  await status('/tasks', { method: 'POST', body: JSON.stringify({ title: '%%dentist%%' }) });
  health.shuttingDown = true; // what the SIGTERM handler in server.ts sets first
  console.log('%%during%%: /livez', await status('/livez'), '/readyz', await status('/readyz'));
  console.log(await (await fetch(`${base}/metrics`, { signal: AbortSignal.timeout(2000) })).text());
} finally {
  server.closeAllConnections();
  server.close();
}
