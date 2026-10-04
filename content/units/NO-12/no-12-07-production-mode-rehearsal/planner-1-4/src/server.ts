// Starts the planner service: configuration, store, listen() — and a graceful shutdown on
// SIGTERM or SIGINT: stop accepting, let requests in flight finish (at most 5 s), then exit.
import { readFileSync } from 'node:fs';
import { createApp, type Health } from './app.ts';
import { loadConfig } from './config.ts';
import { openStore } from './store.ts';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
let config;
try {
  config = loadConfig(process.env);
} catch (error) {
  console.error(`Invalid configuration:\n${(error as Error).message}`);
  process.exit(1);
}
const health: Health = { shuttingDown: false };
const server = createApp(await openStore(config.dataDir), health);
server.listen(config.port, config.host, () => {
  console.log(`planner ${version} (pid ${process.pid}, NODE_ENV=${process.env.NODE_ENV ?? ''}) listening on http://${config.host}:${config.port}`);
});

function shutdown(signal: string) {
  if (health.shuttingDown) return;
  health.shuttingDown = true;
  console.log(`${signal}: draining requests in flight (deadline 5000 ms)`);
  const deadline = setTimeout(() => {
    console.error('deadline passed: cutting connections');
    server.closeAllConnections();
    process.exit(1);
  }, 5000);
  server.close(() => {
    clearTimeout(deadline);
    console.log('drained; the store is already on disk; exit 0');
    process.exitCode = 0;
  });
  server.closeIdleConnections();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
