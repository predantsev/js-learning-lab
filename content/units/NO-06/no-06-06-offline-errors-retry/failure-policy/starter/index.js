// Produces real failures against a loopback server and prints how your functions classify them.
import http from 'node:http';
import { classifyFailure, shouldRetry } from './failures.js';

const server = http.createServer((request, response) => {
  if (request.url === '/slow') return; // never answers
  const status = { '/broken': 500, '/missing': 404 }[request.url] ?? 200;
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(status === 200 ? '{"records":"not-a-list"}' : '{"error":{}}');
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

// A port where nothing listens any more: like a stopped server.
const gone = http.createServer();
await new Promise((resolve) => gone.listen(0, '127.0.0.1', resolve));
const stoppedUrl = `http://127.0.0.1:${gone.address().port}/v1/records`;
await new Promise((resolve) => gone.close(resolve));

const offline = Object.assign(new Error('the adapter reports no network'), { name: 'OfflineError' });
const invalid = Object.assign(new Error('records is not a list'), { name: 'InvalidResponseError' });
const failures = [
  ['%%offline%%', async () => { throw offline; }],
  ['%%stopped%%', () => fetch(stoppedUrl)],
  ['%%timeout%%', () => fetch(`${base}/slow`, { signal: AbortSignal.timeout(200) })],
  ['%%status500%%', () => fetch(`${base}/broken`)],
  ['%%status404%%', () => fetch(`${base}/missing`)],
  ['%%badBody%%', async () => { await fetch(`${base}/ok`).then((r) => r.json()); throw invalid; }],
];
try {
  for (const [label, attempt] of failures) {
    let failure;
    try {
      const response = await attempt();
      failure = response; // fetch resolved: an answer with an error status
    } catch (error) {
      failure = error;
    }
    const kind = classifyFailure(failure);
    const get = shouldRetry(kind, { method: 'GET', status: failure?.status });
    const post = shouldRetry(kind, { method: 'POST', status: failure?.status });
    const postWithKey = shouldRetry(kind, { method: 'POST', status: failure?.status, idempotencyKey: 'k-1' });
    console.log(`${label}: ${kind} — GET ${get}, POST ${post}, POST+key ${postWithKey}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
