// Starts the notes API behind your edge, sends two requests and prints the log entries (read-only).
import { bindHost, createHardenedServer } from './harden.js';

const log = (entry) => console.log(JSON.stringify(entry));
const host = bindHost({ HOST: undefined }, log);
const server = createHardenedServer({ log, trustedProxies: [], allowedOrigin: 'http://localhost:4310' });
await new Promise((resolve) => server.listen(0, host === '0.0.0.0' ? '127.0.0.1' : host, resolve));
console.log('bindHost →', host);
const base = `http://127.0.0.1:${server.address().port}`;
try {
  const auth = { authorization: 'Bearer demo-notes-token' };
  const list = await fetch(`${base}/notes`, { headers: auth, signal: AbortSignal.timeout(1500) });
  console.log(`GET /notes → ${list.status}`);
  const anonymous = await fetch(`${base}/notes`, { headers: { origin: 'http://localhost:4310' }, signal: AbortSignal.timeout(1500) });
  console.log(`GET /notes (Origin, no token) → ${anonymous.status}`);
} finally {
  server.closeAllConnections();
  server.close();
}
