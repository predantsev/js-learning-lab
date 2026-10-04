// Starts the planner API behind your CORS wrapper and prints what three requests get back.
import http from 'node:http';
import { plannerHandler } from './app.js';
import { cors } from './cors.js';

const wrap = cors({ allowedOrigins: ['http://127.0.0.1:5173'], allowCredentials: true });
const server = http.createServer(wrap(plannerHandler));
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const requests = [
  ['%%preflightDev%%', 'OPTIONS', { origin: 'http://127.0.0.1:5173', 'access-control-request-method': 'PATCH', 'access-control-request-headers': 'content-type' }],
  ['%%getDev%%', 'GET', { origin: 'http://127.0.0.1:5173' }],
  ['%%getOther%%', 'GET', { origin: 'http://127.0.0.1:8080' }],
];
try {
  for (const [label, method, headers] of requests) {
    const response = await fetch(`${base}/v1/records`, { method, headers, signal: AbortSignal.timeout(2000) });
    const shown = [...response.headers].filter(([name]) => name.startsWith('access-control-') || name === 'vary');
    console.log(`${label}: ${response.status}`);
    for (const [name, value] of shown) console.log(`  ${name}: ${value}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
