import http from 'node:http';
import { sendJson, handle } from './app.js';
import { repository } from './repository.js';

// A server whose only job is to call sendJson with the status and the value a test asks for.
let next = { status: 200, value: null };
let lastRes = null;
const direct = http.createServer((req, res) => {
  lastRes = res;
  sendJson(res, next.status, next.value);
});
const app = http.createServer(handle);

// Resolves as soon as the status line and the headers arrive; the body is not read.
// One connection per request, so an unfinished answer cannot block the next check.
function head(url, { method = 'GET' } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method, agent: false, signal: AbortSignal.timeout(1000) }, (res) => {
      resolve({ status: res.statusCode, headers: { get: (name) => res.headers[name] ?? null } });
      res.destroy();
    });
    req.on('error', reject);
    req.end();
  });
}

test('sendJson sends the given status', async () => {
  const base = await listen(direct);
  next = { status: 201, value: { id: 't-04' } };
  expect((await head(base)).status, 'status after sendJson(res, 201, …)').toBe(201);
  next = { status: 404, value: { error: 'not found' } };
  expect((await head(base)).status, 'status after sendJson(res, 404, …)').toBe(404);
});

test('sendJson labels the body as JSON', async () => {
  const base = await listen(direct);
  next = { status: 200, value: { id: 't-01' } };
  const type = (await head(base)).headers.get('content-type') ?? '(no Content-Type)';
  expect(type, 'Content-Type after sendJson').toMatch(/^application\/json/);
});

test('sendJson sets Content-Length in bytes', async () => {
  const base = await listen(direct);
  next = { status: 200, value: { title: L.task1, mark: '✓' } };
  const expected = Buffer.byteLength(JSON.stringify(next.value));
  const length = (await head(base)).headers.get('content-length');
  expect(length === null ? '(no Content-Length)' : Number(length), `Content-Length for ${JSON.stringify(next.value)}`).toBe(expected);
});

test('sendJson sends the value as JSON text and finishes', async () => {
  const base = await listen(direct);
  next = { status: 200, value: { id: 't-03', done: false, dueDate: null, priority: 'low' } };
  const response = await request(base, { signal: AbortSignal.timeout(1000) });
  expect(response.json, 'body after sendJson, parsed as JSON').toEqual(next.value);
  // With a correct Content-Length the client can read the whole body even if the server never
  // calls res.end(); the server-side response then stays open, so check it there.
  expect(lastRes?.writableEnded, 'res.writableEnded after sendJson (was res.end() called?)').toBe(true);
});

test('GET /records answers 200', async () => {
  repository.broken = false;
  const response = await head(`${await listen(app)}/records`);
  expect(response.status, 'status of GET /records').toBe(200);
});

test('another method on /records answers 405 with Allow: GET', async () => {
  const response = await head(`${await listen(app)}/records`, { method: 'DELETE' });
  expect(response.status, 'status of DELETE /records').toBe(405);
  expect(response.headers.get('allow') ?? '(no Allow header)', 'Allow header of DELETE /records').toMatch(/GET/);
});

test('an unknown address answers 404', async () => {
  const response = await head(`${await listen(app)}/tasks`);
  expect(response.status, 'status of GET /tasks').toBe(404);
});

test('a failing repository answers 500', async () => {
  repository.broken = true;
  try {
    const response = await head(`${await listen(app)}/records`);
    expect(response.status, 'status of GET /records while the repository throws').toBe(500);
  } finally {
    repository.broken = false;
  }
});
