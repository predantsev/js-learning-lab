// logRequest over real HTTP, with a log function that records the entries it receives.
import http from 'node:http';
import { handleHabits } from './habits.js';
import { logRequest } from './log-request.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

async function start() {
  expect(typeof logRequest, 'type of logRequest').toBe('function');
  const entries = [];
  const base = await listen(http.createServer(logRequest(handleHabits, { log: (entry) => entries.push(entry) })));
  // Sends one request and waits until its log entry has arrived (and a moment longer, to see extra ones).
  const send = async (path, headers = {}) => {
    const before = entries.length;
    const response = await request(base + path, { headers, signal: AbortSignal.timeout(1000) });
    await waitFor(() => entries.length > before, { timeout: 500 }).catch(() => {});
    await sleep(30);
    return { response, logged: entries.slice(before) };
  };
  return send;
}

test('every request writes exactly one entry with the agreed fields', async () => {
  const send = await start();
  const { logged } = await send('/habits');
  expect(logged.length, 'entries for one request').toBe(1);
  const [entry] = logged;
  expect(Object.keys(entry ?? {}).sort(), 'fields of the entry').toEqual(['durationMs', 'level', 'method', 'requestId', 'route', 'status', 'time']);
  expect([entry.method, entry.route, entry.status], 'method, route and status').toEqual(['GET', '/habits', 200]);
  expect(typeof entry.durationMs === 'number' && entry.durationMs >= 0, 'durationMs is a number ≥ 0').toBe(true);
  expect(Number.isNaN(Date.parse(entry.time)), 'time is a date').toBe(false);
});

test('the route is logged without the query string', async () => {
  const send = await start();
  const { logged } = await send('/habits?token=demo-secret&page=2', { authorization: 'Bearer demo-session' });
  expect(logged[0]?.route, 'route of /habits?token=demo-secret&page=2').toBe('/habits');
  expect(JSON.stringify(logged).includes('demo-se'), 'the entry contains the token or the session').toBe(false);
});

test('a well-formed incoming X-Request-Id is reused', async () => {
  const send = await start();
  const { logged } = await send('/habits', { 'x-request-id': 'checkout-1234' });
  expect(logged[0]?.requestId, 'requestId for X-Request-Id: checkout-1234').toBe('checkout-1234');
});

test('a malformed incoming X-Request-Id is replaced with a new UUID', async () => {
  const send = await start();
  for (const bad of ['short', 'x'.repeat(65), 'a b c d e f g h', '<script>alert(1)</script>']) {
    const { logged } = await send('/habits', { 'x-request-id': bad });
    expect(logged[0]?.requestId, `requestId for X-Request-Id: ${bad.slice(0, 20)}`).toMatch(UUID);
  }
  const { logged: noHeader } = await send('/habits');
  expect(noHeader[0]?.requestId ?? '', 'requestId without the header').toMatch(UUID);
});

test('the response carries the same id in X-Request-Id', async () => {
  const send = await start();
  const first = await send('/habits');
  expect(first.response.headers['x-request-id'] ?? '', 'X-Request-Id of the answer').toMatch(UUID);
  expect(first.response.headers['x-request-id'], 'header equals the logged id').toBe(first.logged[0]?.requestId);
  const second = await send('/habits');
  expect(second.response.headers['x-request-id'] !== first.response.headers['x-request-id'], 'two requests get two different ids').toBe(true);
  const reused = await send('/habits', { 'x-request-id': 'checkout-1234' });
  expect(reused.response.headers['x-request-id'], 'X-Request-Id when the client sent checkout-1234').toBe('checkout-1234');
});

test('the level follows the status: info, warn for 4xx, error for 5xx', async () => {
  const send = await start();
  expect((await send('/habits')).logged[0]?.level, 'level for 200').toBe('info');
  expect((await send('/missing')).logged[0]?.level, 'level for 404').toBe('warn');
  expect((await send('/maintenance')).logged[0]?.level, 'level for 503').toBe('error');
});

test('a handler that throws gets 500 INTERNAL with the request id, logged once as error', async () => {
  const send = await start();
  const { response, logged } = await send('/broken');
  expect(response.status, 'status of /broken').toBe(500);
  expect(response.json?.error, 'body of /broken').toEqual({ code: 'INTERNAL', requestId: logged[0]?.requestId });
  expect(logged.map((entry) => [entry.status, entry.level]), 'entries for /broken').toEqual([[500, 'error']]);
});
