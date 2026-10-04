// The limiter with a fake clock, the Origin check directly, then real HTTP requests.
import { createApp } from './app.js';
import { createLoginLimiter, requireSameOrigin } from './guards.js';

function fakeClock() {
  const clock = { ms: 0 };
  clock.now = () => clock.ms;
  return clock;
}

test('five failures for one account block it, from any address, with the seconds to wait', () => {
  const clock = fakeClock();
  const limiter = createLoginLimiter({ now: clock.now });
  for (let i = 0; i < 4; i += 1) limiter.recordFailure('u-01', `10.0.0.${i}`);
  expect(limiter.blockedFor('u-01', '10.0.0.9'), 'after 4 failures').toBe(0);
  limiter.recordFailure('u-01', '10.0.0.4');
  clock.ms = 15_000;
  expect(limiter.blockedFor('u-01', '10.0.0.9'), 'after 5 failures, 15 s later, from a new address').toBe(45);
  expect(limiter.blockedFor('u-02', '10.0.0.9'), 'another account from that new address').toBe(0);
});

test('five failures from one address block it, for any account', () => {
  const limiter = createLoginLimiter({ now: fakeClock().now });
  for (const account of ['u-01', 'u-02', 'u-03', 'u-04', 'u-05']) limiter.recordFailure(account, '10.0.0.7');
  expect(limiter.blockedFor('u-06', '10.0.0.7') > 0, 'a new account from 10.0.0.7 is blocked').toBe(true);
  expect(limiter.blockedFor('u-06', '10.0.0.8'), 'that account from another address').toBe(0);
});

test('a counter expires when its window has passed', () => {
  const clock = fakeClock();
  const limiter = createLoginLimiter({ now: clock.now });
  for (let i = 0; i < 5; i += 1) limiter.recordFailure('u-01', '10.0.0.1');
  clock.ms = 59_999;
  expect(limiter.blockedFor('u-01', '10.0.0.1') > 0, 'blocked 1 ms before the window ends').toBe(true);
  clock.ms = 60_000;
  expect(limiter.blockedFor('u-01', '10.0.0.1'), 'when the window has passed').toBe(0);
  // A new window starts with the next failure: five more failures block again.
  for (let i = 0; i < 5; i += 1) limiter.recordFailure('u-01', '10.0.0.1');
  clock.ms = 70_000;
  expect(limiter.blockedFor('u-01', '10.0.0.1'), 'five new failures in the next window, 10 s later').toBe(50);
});

test('the limiter keeps at most maxEntries counters', () => {
  const limiter = createLoginLimiter({ now: fakeClock().now, maxEntries: 100 });
  for (let i = 0; i < 3000; i += 1) limiter.recordFailure(`random-name-${i}`, `10.1.${Math.floor(i / 250)}.${i % 250}`);
  expect(limiter.size() <= 100, `counters kept: ${limiter.size()}`).toBe(true);
  // A full limiter makes room by dropping the OLDEST counters, so a new attack is still counted.
  for (let i = 0; i < 5; i += 1) limiter.recordFailure('u-01', '10.9.9.9');
  expect(limiter.blockedFor('u-01', '10.9.9.9') > 0, 'u-01 after 5 new failures in a full limiter is blocked').toBe(true);
});

const fakeRequest = (method, origin) => ({ method, headers: origin === undefined ? {} : { origin } });
const statusOf = (request) => {
  try {
    requireSameOrigin(request, ['http://127.0.0.1:4310']);
    return 'passes';
  } catch (error) {
    return error.status;
  }
};

test('requireSameOrigin refuses a state-changing request from another origin, even another port', () => {
  expect(statusOf(fakeRequest('POST', 'https://evil.example')), 'POST from https://evil.example').toBe(403);
  expect(statusOf(fakeRequest('DELETE', 'http://127.0.0.1:5173')), 'DELETE from http://127.0.0.1:5173').toBe(403);
  expect(statusOf(fakeRequest('POST', 'http://127.0.0.1:4310')), 'POST from the allowed origin').toBe('passes');
});

test('requireSameOrigin lets GET and requests without an Origin header through', () => {
  expect(statusOf(fakeRequest('GET', 'https://evil.example')), 'GET from https://evil.example').toBe('passes');
  expect(statusOf(fakeRequest('POST', undefined)), 'POST with no Origin header').toBe('passes');
});

test('over HTTP: the sixth wrong login answers 429 with Retry-After, a foreign POST answers 403', async () => {
  const clock = fakeClock();
  const base = await listen(createApp({ now: clock.now }));
  const call = (method, path, headers = {}, body) => request(`${base}${path}`, { method, headers, body, signal: AbortSignal.timeout(2000) });
  const statuses = [];
  let last;
  for (let i = 0; i < 6; i += 1) {
    last = await call('POST', '/login', {}, { user: 'u-01', password: `guess-${i}` });
    statuses.push(last.status);
  }
  expect(statuses, 'statuses of six wrong logins').toEqual([401, 401, 401, 401, 401, 429]);
  expect(last.headers['retry-after'], 'Retry-After of the sixth').toBe('60');
  clock.ms = 60_000;
  const login = await call('POST', '/login', {}, { user: 'u-02', password: 'river-stone-7' });
  const cookie = [login.headers['set-cookie'] ?? []].flat()[0]?.split(';')[0] ?? '';
  expect((await call('POST', '/wishes', { cookie, origin: 'http://127.0.0.1:5173' })).status, 'POST /wishes from :5173').toBe(403);
  expect((await call('POST', '/wishes', { cookie, origin: 'http://127.0.0.1:4310' })).status, 'POST /wishes from :4310').toBe(201);
});
