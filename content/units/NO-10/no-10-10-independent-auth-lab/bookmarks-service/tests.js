// Checks of the bookmarks lab service: passwords directly, everything else over real HTTP.
import crypto from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import { promisify } from 'node:util';
import { createApp } from './app.js';
import { hashPassword, verifyPassword } from './passwords.js';

const scrypt = promisify(crypto.scrypt);
const KEY = 'lab-key-0123456789abcdefghijklmnopqrstuv';
const MIN = 60_000;

async function start() {
  const clock = { ms: 0, now() { return this.ms; } };
  const server = createApp({ env: { SESSION_SECRET: KEY }, clock });
  const base = await listen(server);
  const call = (method, path, headers = {}, body) =>
    request(`${base}${path}`, { method, headers, body, signal: AbortSignal.timeout(3000) });
  const login = (user, password) => call('POST', '/login', {}, { user, password });
  const cookieOf = (response) => [response.headers['set-cookie'] ?? []].flat()[0]?.split(';')[0] ?? '';
  const session = async (user = 'u-01', password = 'sunflower-42') => cookieOf(await login(user, password));
  return { clock, server, call, login, cookieOf, session };
}

test('passwords: scrypt with a random 16-byte salt and stored parameters', async () => {
  const first = await hashPassword('lantern-31');
  const second = await hashPassword('lantern-31');
  expect(first?.salt === second?.salt, 'two hashes of one password share a salt').toBe(false);
  expect(Buffer.from(String(first?.salt), 'base64').length, 'bytes in the salt').toBe(16);
  const expected = await scrypt('lantern-31', Buffer.from(first.salt, 'base64'), 32, { N: first.N, r: first.r, p: first.p });
  expect(first.hash, 'stored hash = scrypt(password, salt)').toBe(expected.toString('base64'));
  const original = crypto.timingSafeEqual;
  let calls = 0;
  crypto.timingSafeEqual = (a, b) => (calls += 1, original(a, b));
  syncBuiltinESMExports();
  try {
    expect(await verifyPassword('lantern-31', first), 'the right password').toBe(true);
    expect(await verifyPassword('lantern-32', first), 'a wrong password').toBe(false);
  } finally {
    crypto.timingSafeEqual = original;
    syncBuiltinESMExports();
  }
  expect(calls, 'crypto.timingSafeEqual calls').toBe(2);
});

test('createApp refuses a missing, placeholder or short SESSION_SECRET without printing it', () => {
  for (const env of [{}, { SESSION_SECRET: 'changeme' }, { SESSION_SECRET: 'my-own-key-2026' }]) {
    let error = null;
    try {
      createApp({ env });
    } catch (caught) {
      error = caught;
    }
    expect(error instanceof Error, `createApp throws for ${JSON.stringify(env)}`).toBe(true);
    if (env.SESSION_SECRET) expect(error.message.includes(env.SESSION_SECRET), 'the message contains the value').toBe(false);
  }
});

test('login sets an HttpOnly, SameSite=Lax session cookie; unknown user and wrong password get the same 401', async () => {
  const { login } = await start();
  const ok = await login('u-01', 'sunflower-42');
  expect(ok.status, 'status of a right login').toBe(204);
  const setCookie = [ok.headers['set-cookie'] ?? []].flat()[0] ?? '';
  expect(/^sid=[A-Za-z0-9_-]{43,}|^sid=[0-9a-f]{64,}/.test(setCookie), `random sid in "${setCookie}"`).toBe(true);
  expect(/;\s*httponly/i.test(setCookie) && /;\s*samesite=lax/i.test(setCookie), 'HttpOnly and SameSite=Lax').toBe(true);
  const wrong = await login('u-01', 'guess-1');
  const unknown = await login('u-77', 'guess-1');
  expect([wrong.status, unknown.status], 'statuses of a wrong password and an unknown user').toEqual([401, 401]);
  expect(unknown.text, 'body for an unknown user').toBe(wrong.text);
});

test('the sixth failed login in a minute answers 429 with Retry-After; a minute later login works', async () => {
  const { clock, login } = await start();
  const statuses = [];
  let last;
  for (let i = 0; i < 6; i += 1) {
    last = await login('u-02', `guess-${i}`);
    statuses.push(last.status);
  }
  expect(statuses, 'six wrong logins').toEqual([401, 401, 401, 401, 401, 429]);
  expect(last.headers['retry-after'], 'Retry-After').toBe('60');
  clock.ms = MIN;
  expect((await login('u-02', 'river-stone-7')).status, 'a right login a minute later').toBe(204);
});

test('a login body over 1 KB answers 413', async () => {
  const { login } = await start();
  expect((await login('u-01', 'x'.repeat(3000))).status, 'status for a 3 KB body').toBe(413);
});

test('bookmarks are scoped to their owner: foreign ones answer 404 and stay', async () => {
  const { call, session } = await start();
  const marta = await session();
  const bohdan = await session('u-02', 'river-stone-7');
  expect([(await call('GET', '/bookmarks', { cookie: marta })).json].flat().map((b) => b?.id), "u-01's list").toEqual(['b-1', 'b-2']);
  expect((await call('GET', '/bookmarks/b-1', { cookie: bohdan })).status, 'u-02 GET /bookmarks/b-1').toBe(404);
  expect((await call('DELETE', '/bookmarks/b-1', { cookie: bohdan })).status, 'u-02 DELETE /bookmarks/b-1').toBe(404);
  expect((await call('GET', '/bookmarks/b-1', { cookie: marta })).status, 'u-01 GET /bookmarks/b-1 afterwards').toBe(200);
  expect((await call('GET', '/bookmarks')).status, 'GET /bookmarks with no session').toBe(401);
});

test('sessions expire after 30 idle minutes or 2 hours, and logout revokes them', async () => {
  const { clock, call, session } = await start();
  const idle = await session();
  clock.ms = 30 * MIN + 1;
  expect((await call('GET', '/bookmarks', { cookie: idle })).status, 'after 30 min + 1 ms idle').toBe(401);
  clock.ms = 30 * MIN;
  const active = await session(); // logged in at minute 30
  for (const minute of [50, 70, 90, 110, 130, 150]) {
    clock.ms = minute * MIN;
    expect((await call('GET', '/bookmarks', { cookie: active })).status, `active session at minute ${minute}`).toBe(200);
  }
  clock.ms = 150 * MIN + 1;
  expect((await call('GET', '/bookmarks', { cookie: active })).status, '2 h + 1 ms after login').toBe(401);
  const leaving = await session();
  expect((await call('POST', '/logout', { cookie: leaving })).status, 'POST /logout').toBe(204);
  expect((await call('GET', '/bookmarks', { cookie: leaving })).status, 'the cookie after logout').toBe(401);
});

test('a state-changing request from a foreign origin, even another port, answers 403', async () => {
  const { call, session } = await start();
  const cookie = await session();
  const body = { title: 'Docs', url: 'https://example.org/x' };
  expect((await call('POST', '/bookmarks', { cookie, origin: 'http://127.0.0.1:5173' }, body)).status, 'POST from :5173').toBe(403);
  expect((await call('POST', '/bookmarks', { cookie, origin: 'http://127.0.0.1:4310' }, body)).status, 'POST from :4310').toBe(201);
  expect((await call('POST', '/bookmarks', { cookie }, body)).status, 'POST with no Origin').toBe(201);
});

test('the server limits how long a request may take to arrive: at most 5 s', async () => {
  const { server } = await start();
  expect(server.requestTimeout > 0 && server.requestTimeout <= 5000, `requestTimeout ${server.requestTimeout}`).toBe(true);
  expect(server.headersTimeout > 0 && server.headersTimeout <= 5000, `headersTimeout ${server.headersTimeout}`).toBe(true);
});
