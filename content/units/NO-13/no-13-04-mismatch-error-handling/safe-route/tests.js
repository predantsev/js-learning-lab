import http from 'node:http';
import { createRenderRoute, reportRecoverable } from './route.js';

const good = () => [{ id: 't-05', title: L.dentist, dueDate: '2026-03-10' }];
const damaged = () => [{ id: 't-08', title: L.imported, dueDate: { year: 2026 } }];

async function serve(loadTasks) {
  expect(typeof createRenderRoute, 'type of createRenderRoute').toBe('function');
  const entries = [];
  const handler = createRenderRoute({ loadTasks, log: (entry) => entries.push(entry) });
  expect(typeof handler, 'type of what createRenderRoute returns').toBe('function');
  const base = await listen(http.createServer(handler));
  return { base, entries };
}

test('a good request answers 200 with the rendered page', async () => {
  const { base } = await serve(good);
  const response = await request(`${base}/`);
  expect(response.status, 'status of GET /').toBe(200);
  expect(response.headers['content-type'] ?? '', 'content-type of GET /').toMatch(/^text\/html/);
  expect(response.text, 'body of GET /').toContain(`<div id="root"><ul><li>${L.dentist}`);
});

test('a render error answers 500 with the fallback page and the request id', async () => {
  const { base } = await serve(damaged);
  const response = await request(`${base}/`);
  expect(response.status, 'status when the render throws').toBe(500);
  expect(response.headers['content-type'] ?? '', 'content-type of the 500 answer').toMatch(/^text\/html/);
  expect(response.text, 'body of the 500 answer').toContain(L.errorTitle);
  const id = response.headers['x-request-id'];
  expect(typeof id === 'string' && id.length > 0, 'an x-request-id header on the 500 answer').toBe(true);
  expect(response.text, 'body of the 500 answer').toContain(id);
});

test('the 500 page shows no error details', async () => {
  const { base } = await serve(damaged);
  const response = await request(`${base}/`);
  expect(response.status, 'status when the render throws').toBe(500);
  expect(/slice|TypeError|is not a function|\bat\s+\w+\s*\(/.test(response.text), `error details in the 500 page: ${response.text}`).toBe(false);
});

test('the error is logged once with the request id and the message', async () => {
  const { base, entries } = await serve(damaged);
  const response = await request(`${base}/`, { headers: { 'x-request-id': 'req-check-500' } });
  expect(response.status, 'status when the render throws').toBe(500);
  expect(entries.length, 'number of log entries').toBe(1);
  expect(entries[0], 'the log entry').toMatchObject({ level: 'error', requestId: 'req-check-500' });
  expect(String(entries[0].message), 'message in the log entry').toContain('slice');
});

test('an incoming x-request-id is kept', async () => {
  const { base } = await serve(good);
  const response = await request(`${base}/`, { headers: { 'x-request-id': 'req-check-42' } });
  expect(response.headers['x-request-id'], 'x-request-id of the answer').toBe('req-check-42');
});

test('the server keeps answering after a failed request', async () => {
  let call = 0;
  const { base } = await serve(() => (call++ === 0 ? damaged() : good()));
  const first = await request(`${base}/`);
  expect(first.status, 'status of the first request').toBe(500);
  const second = await request(`${base}/`);
  expect(second.status, 'status of the next request').toBe(200);
});

test('reportRecoverable logs the mismatch with its component stack', () => {
  expect(typeof reportRecoverable, 'type of reportRecoverable').toBe('function');
  const entries = [];
  const onRecoverableError = reportRecoverable((entry) => entries.push(entry), 'req-check-7');
  expect(typeof onRecoverableError, 'type of what reportRecoverable returns').toBe('function');
  onRecoverableError(new Error(L.mismatchMessage), { componentStack: '\n    at li\n    at TaskList' });
  expect(entries.length, 'number of log entries').toBe(1);
  expect(entries[0], 'the log entry').toMatchObject({ requestId: 'req-check-7', message: L.mismatchMessage, componentStack: '\n    at li\n    at TaskList' });
});
