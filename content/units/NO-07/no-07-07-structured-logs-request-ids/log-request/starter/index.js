// Starts the habits API behind your logRequest and sends four requests (read-only).
// The log writer prints every entry as one JSON line.
import http from 'node:http';
import { handleHabits } from './habits.js';
import { logRequest } from './log-request.js';

const writeLog = (entry) => console.log(JSON.stringify(entry));
const server = http.createServer(logRequest(handleHabits, { log: writeLog }));
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  const calls = [
    ['/habits?token=demo-secret', { authorization: 'Bearer demo-session' }],
    ['/missing', { 'x-request-id': 'checkout-1234' }],
    ['/maintenance', {}],
  ];
  for (const [path, headers] of calls) {
    const response = await fetch(base + path, { headers, signal: AbortSignal.timeout(1000) });
    console.log(`%%client%% GET ${path} → ${response.status}, x-request-id: ${response.headers.get('x-request-id')}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
