import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { checkContract, loadConfig, startService, verifyRestore } from './ops.js';

const DATA = '/srv/bookmarks/data';
const baseline = { SIGTERM: process.listenerCount('SIGTERM'), SIGINT: process.listenerCount('SIGINT') };
const guard = (...names) => {
  const fns = { loadConfig, startService, verifyRestore, checkContract };
  for (const name of names) expect(typeof fns[name], `type of ${name}`).toBe('function');
};
const errorOf = (fn) => { try { fn(); return ''; } catch (error) { return String(error?.message); } };
const bookmark = (id, extra = {}) => ({ id, title: L.docs, url: 'https://example.invalid/docs', slug: 'docs', archived: false, ...extra });

// --- configuration
test('loadConfig: defaults and a frozen result', () => {
  guard('loadConfig');
  const config = loadConfig({ DATA_DIR: DATA });
  expect({ ...config }, 'the config of { DATA_DIR } alone').toEqual({ port: 7374, host: '127.0.0.1', dataDir: DATA, deadlineMs: 5000 });
  expect(Object.isFrozen(config), 'Object.isFrozen(config)').toBe(true);
});

test('loadConfig: one error names every invalid variable', () => {
  guard('loadConfig');
  const message = errorOf(() => loadConfig({ PORT: '1e3', HOST: '0.0.0.0', DATA_DIR: 'data', DEADLINE_MS: '50' }));
  for (const name of ['PORT', 'HOST', 'DATA_DIR', 'DEADLINE_MS']) expect(message, 'the error').toContain(name);
});

test('loadConfig: process.env is not read', () => {
  guard('loadConfig');
  const saved = process.env.PORT;
  process.env.PORT = '1234';
  try {
    expect(loadConfig({ DATA_DIR: DATA }).port, 'port while process.env.PORT is 1234').toBe(7374);
  } finally {
    if (saved === undefined) delete process.env.PORT;
    else process.env.PORT = saved;
  }
});

// --- the service
function fakeStore({ ready = true, addMs = 0 } = {}) {
  const records = [bookmark('bm-1')];
  const events = [];
  return {
    events,
    isReady: () => ready,
    list: () => records,
    async add({ title, url }) {
      await sleep(addMs);
      const record = bookmark(`bm-${records.length + 1}`, { title, url });
      records.push(record);
      events.push('add done');
      return record;
    },
    async flush() { events.push('flush'); },
  };
}
async function start(store, deadlineMs = 2000) {
  const exits = [];
  const lines = [];
  const { url } = await startService({ port: 0, host: '127.0.0.1', dataDir: DATA, deadlineMs }, { store, exit: (code) => { exits.push(code); store.events.push(`exit ${code}`); }, log: (line) => lines.push(line) });
  return { url, exits, lines };
}
async function stop(s) {
  process.emit('SIGTERM', 'SIGTERM');
  await waitFor(() => s.exits.length > 0, { timeout: 2500 }).catch(() => {});
}
const post = (url, body) => fetch(`${url}/bookmarks`, { method: 'POST', body: JSON.stringify(body), signal: AbortSignal.timeout(4000) }).then((r) => r.status, (e) => e.cause?.code ?? e.name);

test('startService: /livez and /readyz follow the store', async () => {
  guard('startService');
  for (const [ready, expected] of [[true, [200, 200]], [false, [200, 503]]]) {
    const s = await start(fakeStore({ ready }));
    try {
      expect([(await request(`${s.url}/livez`)).status, (await request(`${s.url}/readyz`)).status], `[livez, readyz] with a store that is ${ready ? '' : 'not '}ready`).toEqual(expected);
    } finally {
      await stop(s);
    }
  }
});

test('startService: POST /bookmarks validates and creates, GET /bookmarks lists', async () => {
  guard('startService');
  const s = await start(fakeStore());
  try {
    expect([await post(s.url, { title: ' ', url: 'https://example.invalid' }), await post(s.url, { title: L.docs })], 'statuses of an empty title and a missing url').toEqual([400, 400]);
    expect(await post(s.url, { title: L.docs, url: 'https://example.invalid/new' }), 'status of a valid POST').toBe(201);
    const list = await request(`${s.url}/bookmarks`);
    expect([list.status, Array.isArray(list.json) ? list.json.map((b) => b.id) : list.json], '[status, ids] of GET /bookmarks after the valid POST').toEqual([200, ['bm-1', 'bm-2']]);
  } finally {
    await stop(s);
  }
});

test('startService: one log line per request without the body', async () => {
  guard('startService');
  const s = await start(fakeStore());
  try {
    await post(s.url, { title: L.secretTitle, url: 'https://example.invalid/private' });
    const line = s.lines.find((l) => l?.route === '/bookmarks');
    expect(line, 'the log line of POST /bookmarks').toMatchObject({ route: '/bookmarks', status: 201 });
    expect(typeof line?.requestId === 'string' && typeof line?.ms === 'number', 'requestId is text and ms a number').toBe(true);
    expect(JSON.stringify(s.lines).includes(L.secretTitle) || JSON.stringify(s.lines).includes('private'), 'the log lines contain the request body').toBe(false);
  } finally {
    await stop(s);
  }
});

test('startService: SIGTERM refuses new connections, drains the POST in flight, flushes, exits 0 and removes its listeners', async () => {
  guard('startService');
  const store = fakeStore({ addMs: 300 });
  const s = await start(store);
  const answer = post(s.url, { title: L.docs, url: 'https://example.invalid/slow' });
  await sleep(80);
  process.emit('SIGTERM', 'SIGTERM');
  await sleep(30);
  const late = await fetch(`${s.url}/livez`, { signal: AbortSignal.timeout(1000) }).then((r) => r.status, (e) => e.cause?.code ?? e.name);
  expect(late, 'a new connection after SIGTERM').toBe('ECONNREFUSED');
  expect(await answer, 'status of the POST in flight').toBe(201);
  await waitFor(() => s.exits.length > 0, { timeout: 1500 }).catch(() => {});
  expect(store.events, 'what happened, in order').toEqual(['add done', 'flush', 'exit 0']);
  expect({ SIGTERM: process.listenerCount('SIGTERM'), SIGINT: process.listenerCount('SIGINT') }, 'listeners left').toEqual(baseline);
});

test('startService: past the deadline it exits with 1', async () => {
  guard('startService');
  const s = await start(fakeStore({ addMs: 2500 }), 200);
  const answer = post(s.url, { title: L.docs, url: 'https://example.invalid/stuck' });
  await sleep(50);
  process.emit('SIGINT', 'SIGINT');
  await waitFor(() => s.exits.length > 0, { timeout: 1500 }).catch(() => {});
  expect(s.exits, 'exit codes').toEqual([1]);
  await answer;
});

// --- restore check
let cases = 0;
async function folders(restoredText) {
  const base = tmp(`restore-${++cases}/source/bookmarks.json`).replace(/\/source\/bookmarks\.json$/, '');
  await writeFile(`${base}/source/bookmarks.json`, JSON.stringify({ schemaVersion: 1, records: [bookmark('bm-1'), bookmark('bm-2', { archived: true }), bookmark('bm-3')] }));
  if (restoredText !== null) await writeFile(tmp(`restore-${cases}/restored/bookmarks.json`), restoredText);
  else tmp(`restore-${cases}/restored/x`);
  return { source: `${base}/source`, restored: `${base}/restored` };
}
const reportOf = async (f) => { try { return await verifyRestore(f.source, f.restored); } catch (error) { return { thrown: error.message }; } };
const restoredOf = (records) => JSON.stringify({ schemaVersion: 1, records });

test('verifyRestore: an exact copy in another order passes', async () => {
  guard('verifyRestore');
  expect(await reportOf(await folders(restoredOf([bookmark('bm-3'), bookmark('bm-2', { archived: true }), bookmark('bm-1')]))), 'the report').toEqual({ ok: true, problems: [] });
});

test('verifyRestore: a missing id and a changed summary are reported', async () => {
  guard('verifyRestore');
  const missing = await reportOf(await folders(restoredOf([bookmark('bm-1'), bookmark('bm-2', { archived: true })])));
  expect(missing.ok === false && String(missing.problems).includes('bm-3'), `a report naming bm-3 (got ${JSON.stringify(missing)})`).toBe(true);
  const changed = await reportOf(await folders(restoredOf([bookmark('bm-1'), bookmark('bm-2'), bookmark('bm-3')])));
  expect(changed.ok, 'report.ok when bm-2 is no longer archived').toBe(false);
});

test('verifyRestore: a torn or missing file is reported, not thrown', async () => {
  guard('verifyRestore');
  const torn = await reportOf(await folders(restoredOf([bookmark('bm-1')]).slice(0, 40)));
  expect([torn.thrown ?? null, torn.ok], '[thrown, ok] for a torn file').toEqual([null, false]);
  const none = await reportOf(await folders(null));
  expect([none.thrown ?? null, none.ok], '[thrown, ok] without bookmarks.json').toEqual([null, false]);
});

// --- contract check
async function serverAnswering(status, body) {
  const server = http.createServer((request, response) => {
    response.writeHead(status, { 'content-type': 'application/json' });
    response.end(JSON.stringify(body));
  });
  return listen(server);
}

test('checkContract: a good answer gives no problems, a broken slug is named', async () => {
  guard('checkContract');
  expect(await checkContract(await serverAnswering(200, [bookmark('bm-1')])), 'problems of a good answer').toEqual([]);
  const problems = await checkContract(await serverAnswering(200, [bookmark('bm-1'), bookmark('bm-2', { slug: 'node_docs' })]));
  expect(String(problems), 'problems of an answer with slug node_docs').toContain('[1].slug');
});

test('checkContract: a wrong status or no server is a problem, not an exception', async () => {
  guard('checkContract');
  let result;
  try {
    result = [await checkContract(await serverAnswering(500, { error: 'internal error' })), await checkContract('http://127.0.0.1:9')];
  } catch (error) {
    result = `threw ${error.message}`;
  }
  expect(Array.isArray(result) && result.every((p) => Array.isArray(p) && p.length > 0), `problems for status 500 and for no server (got ${JSON.stringify(result)})`).toBe(true);
});
