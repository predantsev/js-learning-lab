import { startServer } from './app.js';

const guard = () => expect(typeof startServer, 'type of startServer').toBe('function');
const baseline = { SIGTERM: process.listenerCount('SIGTERM'), SIGINT: process.listenerCount('SIGINT') };

// A store whose update takes `updateMs`; every step is recorded in `events`.
function setup({ updateMs = 300, ready = true, deadlineMs = 2000 } = {}) {
  const events = [];
  const store = {
    isReady: () => ready,
    list: () => [{ id: 'e-05', label: L.cinema, amountMinor: 30000, category: 'fun' }],
    async update(id, changes) {
      await sleep(updateMs);
      events.push('update done');
      return { id, ...changes };
    },
    async flush() {
      events.push('flush');
    },
  };
  const exits = [];
  const exit = (code) => { exits.push(code); events.push(`exit ${code}`); };
  return { events, exits, start: () => startServer({ port: 0, host: '127.0.0.1', store, deadlineMs }, { exit, log: () => {} }) };
}
const get = (url) => fetch(url, { signal: AbortSignal.timeout(1000) }).then((r) => r.status, (e) => e.cause?.code ?? e.name);
const patch = (url) => fetch(`${url}/expenses/e-05`, { method: 'PATCH', body: JSON.stringify({ amountMinor: 25000 }), signal: AbortSignal.timeout(4000) })
  .then((r) => r.status, (e) => e.cause?.code ?? e.name);
// Ends a test's server through its own handler (the checks emit the signal on process instead of
// sending a real one, so that a missing handler fails a check instead of stopping the whole run).
async function stop(t) {
  process.emit('SIGTERM', 'SIGTERM');
  await waitFor(() => t.exits.length > 0, { timeout: 2500 }).catch(() => {});
}

test('GET /livez and GET /readyz answer 200 when the store is ready', async () => {
  guard();
  const t = setup();
  const { url } = await t.start();
  try {
    expect([await get(`${url}/livez`), await get(`${url}/readyz`)], '[status of /livez, status of /readyz]').toEqual([200, 200]);
  } finally {
    await stop(t);
  }
});

test('GET /readyz answers 503 while the store is not ready, /livez stays 200', async () => {
  guard();
  const t = setup({ ready: false });
  const { url } = await t.start();
  try {
    expect([await get(`${url}/livez`), await get(`${url}/readyz`)], '[status of /livez, status of /readyz]').toEqual([200, 503]);
  } finally {
    await stop(t);
  }
});

test('SIGTERM lets the PATCH in flight finish, flushes, then exits with 0', async () => {
  guard();
  const t = setup();
  const { url } = await t.start();
  const answer = patch(url);
  await sleep(80);
  process.emit('SIGTERM', 'SIGTERM');
  expect(await answer, 'status of the PATCH in flight').toBe(200);
  await waitFor(() => t.exits.length > 0, { timeout: 1500 }).catch(() => {});
  expect(t.events, 'what happened, in order').toEqual(['update done', 'flush', 'exit 0']);
});

test('after SIGTERM new connections are refused', async () => {
  guard();
  const t = setup();
  const { url } = await t.start();
  const answer = patch(url);
  await sleep(80);
  process.emit('SIGTERM', 'SIGTERM');
  await sleep(30);
  expect(await get(`${url}/expenses`), 'a new request after SIGTERM').toBe('ECONNREFUSED');
  await answer;
  await waitFor(() => t.exits.length > 0, { timeout: 1500 }).catch(() => {});
});

test('SIGINT starts the same shutdown', async () => {
  guard();
  const t = setup();
  await t.start();
  process.emit('SIGINT', 'SIGINT');
  await waitFor(() => t.exits.length > 0, { timeout: 1500 }).catch(() => {});
  expect(t.events, 'what happened after SIGINT').toEqual(['flush', 'exit 0']);
  if (t.exits.length === 0) await stop(t);
});

test('past the deadline it cuts the request off and exits with 1', async () => {
  guard();
  const t = setup({ updateMs: 2500, deadlineMs: 200 });
  const { url } = await t.start();
  const answer = patch(url);
  await sleep(50);
  const started = Date.now();
  process.emit('SIGTERM', 'SIGTERM');
  await waitFor(() => t.exits.length > 0, { timeout: 1500 }).catch(() => {});
  expect(t.exits, 'exit codes').toEqual([1]);
  expect(Date.now() - started, 'ms from SIGTERM to exit').toBeLessThan(1000);
  expect(await answer, 'the PATCH that was cut off').not.toBe(200);
});

test('a second signal does not start a second shutdown', async () => {
  guard();
  const t = setup();
  await t.start();
  process.emit('SIGTERM', 'SIGTERM');
  process.emit('SIGTERM', 'SIGTERM');
  process.emit('SIGINT', 'SIGINT');
  await waitFor(() => t.exits.length > 0, { timeout: 1500 }).catch(() => {});
  await sleep(100);
  expect(t.exits, 'exit codes').toEqual([0]);
});

test('the shutdown removes its signal listeners', async () => {
  guard();
  const t = setup();
  await t.start();
  await stop(t);
  expect({ SIGTERM: process.listenerCount('SIGTERM'), SIGINT: process.listenerCount('SIGINT') }, 'listeners left on process').toEqual(baseline);
});
