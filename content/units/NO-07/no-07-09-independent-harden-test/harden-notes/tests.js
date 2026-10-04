// Hidden checks of the hardened notes API: real HTTP, raw sockets for the slow client.
import net from 'node:net';
import { bindHost, createHardenedServer } from './harden.js';

const ORIGIN = 'http://localhost:4310';
const AUTH = { authorization: 'Bearer demo-notes-token' };

async function start({ trustedProxies = [] } = {}) {
  expect(typeof createHardenedServer, 'type of createHardenedServer').toBe('function');
  const entries = [];
  const base = await listen(createHardenedServer({ log: (entry) => entries.push(entry), trustedProxies, allowedOrigin: ORIGIN }));
  const call = (path, { method = 'GET', headers = {}, body } = {}) => request(base + path, { method, headers, body, signal: AbortSignal.timeout(1500) });
  return { base, call, entries, port: Number(new URL(base).port) };
}
const statuses = async (count, send) => {
  const out = [];
  for (let i = 0; i < count; i += 1) out.push((await send(i)).status);
  return out;
};

test('an authenticated client can list and create notes', async () => {
  const { call } = await start();
  expect((await call('/notes', { headers: AUTH })).status, 'status of GET /notes with the token').toBe(200);
  const created = await call('/notes', { method: 'POST', headers: AUTH, body: { text: L.note2 } });
  expect(created.status, 'status of POST /notes').toBe(201);
});

test('a body over 2048 bytes answers 413', async () => {
  const { call } = await start();
  const response = await call('/notes', { method: 'POST', headers: AUTH, body: { text: 'x'.repeat(3000) } });
  expect(response.status, 'status for a 3 KB body').toBe(413);
});

test('a client that sends its headers too slowly gets 408', async () => {
  const { port } = await start();
  const status = await new Promise((resolve) => {
    const socket = net.connect(port, '127.0.0.1');
    const text = 'GET /notes HTTP/1.1\r\nHost: lab\r\n\r\n';
    let index = 0;
    let answer = '';
    const timer = setInterval(() => {
      if (socket.destroyed || index >= text.length) return clearInterval(timer);
      socket.write(text[index]);
      index += 1;
    }, 100);
    const stop = setTimeout(() => { socket.destroy(); resolve(null); }, 1200);
    socket.on('data', (data) => {
      answer += data;
      clearTimeout(stop);
      clearInterval(timer);
      socket.destroy();
      resolve(Number(answer.split(' ')[1]));
    });
    socket.on('error', () => {});
  });
  expect(status, 'status within 1.2 s for headers at one character per 100 ms').toBe(408);
});

test('the sixth request within a second from one client answers 429 with Retry-After', async () => {
  const { call } = await start();
  const answers = [];
  for (let i = 0; i < 6; i += 1) answers.push(await call('/notes', { headers: AUTH }));
  expect(answers.map((answer) => answer.status), 'statuses of six requests in a row').toEqual([200, 200, 200, 200, 200, 429]);
  expect(Number(answers[5].headers['retry-after']) >= 1, 'Retry-After of the 429 is at least 1').toBe(true);
});

test('a forged X-Forwarded-For does not dodge the limit when the peer is not a trusted proxy', async () => {
  const { call } = await start();
  const got = await statuses(6, (i) => call('/notes', { headers: { ...AUTH, 'x-forwarded-for': `203.0.113.${i + 1}` } }));
  expect(got, 'statuses of six requests with six different X-Forwarded-For values').toEqual([200, 200, 200, 200, 200, 429]);
});

test('behind a trusted proxy each client address gets its own limit', async () => {
  const { call } = await start({ trustedProxies: ['127.0.0.1'] });
  const different = await statuses(6, (i) => call('/notes', { headers: { ...AUTH, 'x-forwarded-for': `203.0.113.${i + 1}` } }));
  expect(different, 'six requests from six clients behind the proxy').toEqual([200, 200, 200, 200, 200, 200]);
  const same = await statuses(6, () => call('/notes', { headers: { ...AUTH, 'x-forwarded-for': '198.51.100.4' } }));
  expect(same, 'six requests from one client behind the proxy').toEqual([200, 200, 200, 200, 200, 429]);
});

test('CORS allows exactly the configured origin', async () => {
  const { call } = await start();
  const allowed = await call('/notes', { headers: { ...AUTH, origin: ORIGIN } });
  expect(allowed.headers['access-control-allow-origin'], 'Access-Control-Allow-Origin for the allowed origin').toBe(ORIGIN);
  const foreign = await call('/notes', { headers: { ...AUTH, origin: 'http://evil.test' } });
  expect(foreign.headers['access-control-allow-origin'], 'Access-Control-Allow-Origin for another origin').toBe(undefined);
});

test('CORS is not authentication: the token decides, with or without Origin', async () => {
  const { call } = await start();
  expect((await call('/notes', { headers: { origin: ORIGIN } })).status, 'allowed Origin without the token').toBe(401);
  expect((await call('/notes', { headers: AUTH })).status, 'the token without any Origin (like curl)').toBe(200);
});

test('a preflight from the allowed origin answers 204 with the allowed methods and headers', async () => {
  const { call } = await start();
  const preflight = await call('/notes', { method: 'OPTIONS', headers: { origin: ORIGIN, 'access-control-request-method': 'POST', 'access-control-request-headers': 'authorization, content-type' } });
  expect(preflight.status, 'status of the preflight').toBe(204);
  expect(preflight.headers['access-control-allow-origin'], 'Access-Control-Allow-Origin of the preflight').toBe(ORIGIN);
  expect(preflight.headers['access-control-allow-methods'] ?? '', 'Access-Control-Allow-Methods').toMatch(/POST/);
  expect((preflight.headers['access-control-allow-headers'] ?? '').toLowerCase(), 'Access-Control-Allow-Headers').toMatch(/authorization/);
});

test('bindHost defaults to 127.0.0.1 and warns about any other address', () => {
  expect(typeof bindHost, 'type of bindHost').toBe('function');
  const quiet = [];
  expect(bindHost({}, (entry) => quiet.push(entry)), 'bindHost with no HOST').toBe('127.0.0.1');
  expect(quiet.length, 'log entries for the default').toBe(0);
  const loud = [];
  expect(bindHost({ HOST: '0.0.0.0' }, (entry) => loud.push(entry)), 'bindHost with HOST 0.0.0.0').toBe('0.0.0.0');
  expect(loud.some((entry) => entry?.level === 'warn'), 'a warn entry for 0.0.0.0').toBe(true);
});

test('one JSON log entry per request, with the request id and no secrets', async () => {
  const { call, entries } = await start();
  const answers = [];
  for (let i = 0; i < 6; i += 1) answers.push(await call(`/notes?token=demo-query-${i}`, { headers: AUTH }));
  await waitFor(() => entries.length >= 6, { timeout: 500 }).catch(() => {});
  await sleep(30);
  expect(entries.length, 'log entries for six requests').toBe(6);
  expect(entries.map((entry) => entry?.requestId), 'requestId of each entry').toEqual(answers.map((answer) => answer.headers['x-request-id']));
  expect(entries.map((entry) => entry?.status), 'status of each entry').toEqual([200, 200, 200, 200, 200, 429]);
  expect(JSON.stringify(entries).includes('demo-'), 'the entries contain the token or the query').toBe(false);
});
