// A short demo of tiny-server.mjs: start it on a free port, send it requests, stop it.
// In your terminal you start the same file with `node tiny-server.mjs` instead.
import { createTinyServer } from './tiny-server.mjs';

const server = createTinyServer({ log: (line) => console.log(`  [server] ${line}`) });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

try {
  for (const [method, path] of [['GET', '/health'], ['GET', '/records/w-02'], ['DELETE', '/records/w-02'], ['GET', '/nope']]) {
    const response = await fetch(base + path, { method, signal: AbortSignal.timeout(2000) });
    console.log(`${method} ${path} → ${response.status} ${await response.text()}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
