// Real HTTP requests to the habit tracker lab service. The Node child has no cookie store,
// so every check sends the Cookie header itself, as a browser would.
import { createApp } from './app.js';

const json = { 'content-type': 'application/json' };

async function start() {
  const base = await listen(createApp());
  const call = (method, path, headers = {}, body) =>
    request(`${base}${path}`, { method, headers, body, signal: AbortSignal.timeout(2000) });
  const login = (userId = 'u-01', password = 'sunflower-42') =>
    call('POST', '/login', json, JSON.stringify({ userId, password }));
  return { call, login };
}

// "sid=abc; HttpOnly; SameSite=Lax; Path=/" → { name: 'sid', value: 'abc', attributes: Map }
function parseSetCookie(response) {
  const header = [response.headers['set-cookie'] ?? []].flat()[0] ?? '';
  const [pair, ...rest] = header.split(';').map((part) => part.trim());
  const [name, ...value] = (pair ?? '').split('=');
  const attributes = new Map(rest.map((part) => {
    const [key, ...val] = part.split('=');
    return [key.toLowerCase(), val.join('=')];
  }));
  return { name, value: value.join('='), attributes };
}

test('login sets a sid cookie with HttpOnly, SameSite=Lax and Path=/', async () => {
  const { login } = await start();
  const cookie = parseSetCookie(await login());
  expect(cookie.name, 'name of the cookie').toBe('sid');
  expect(cookie.attributes.has('httponly'), 'HttpOnly is present').toBe(true);
  expect(cookie.attributes.get('samesite')?.toLowerCase(), 'value of SameSite').toBe('lax');
  expect(cookie.attributes.get('path'), 'value of Path').toBe('/');
});

test('the session id is long, random and says nothing about the user', async () => {
  const { login } = await start();
  const ids = [];
  for (let i = 0; i < 10; i += 1) ids.push(parseSetCookie(await login()).value);
  for (const id of ids) {
    const looksRandom = /^[A-Za-z0-9_-]{43,}$/.test(id) || /^[0-9a-f]{64,}$/.test(id);
    expect(looksRandom, `id "${id}" is 32+ random bytes as base64url or hex`).toBe(true);
    expect(id.includes('u-01') || id.includes('u01'), `id "${id}" contains the user id`).toBe(false);
  }
  expect(new Set(ids).size, 'different ids among 10 logins').toBe(10);
});

test("a request with the sid cookie gets that user's habits", async () => {
  const { call, login } = await start();
  const sid = parseSetCookie(await login('u-02', 'river-stone-7')).value;
  const response = await call('GET', '/habits', { cookie: `sid=${sid}` });
  expect(response.status, 'status of GET /habits with the cookie').toBe(200);
  expect((response.json ?? []).map((habit) => habit.id), 'habits of u-02').toEqual(['h-03']);
});

test('readSession finds sid among several cookies', async () => {
  const { call, login } = await start();
  const sid = parseSetCookie(await login()).value;
  const response = await call('GET', '/habits', { cookie: `theme=dark; sid=${sid}; lang=uk` });
  expect(response.status, 'status with "theme=dark; sid=…; lang=uk"').toBe(200);
});

test('a missing or unknown sid answers 401', async () => {
  const { call } = await start();
  expect((await call('GET', '/habits')).status, 'status with no Cookie header').toBe(401);
  expect((await call('GET', '/habits', { cookie: 'theme=dark' })).status, 'status with only "theme=dark"').toBe(401);
  const forged = 'A'.repeat(43);
  expect((await call('GET', '/habits', { cookie: `sid=${forged}` })).status, 'status with a made-up sid').toBe(401);
});

test('after logout the old cookie answers 401', async () => {
  const { call, login } = await start();
  const sid = parseSetCookie(await login()).value;
  expect((await call('POST', '/logout', { cookie: `sid=${sid}` })).status, 'status of POST /logout').toBe(204);
  expect((await call('GET', '/habits', { cookie: `sid=${sid}` })).status, 'status with the old cookie').toBe(401);
});
