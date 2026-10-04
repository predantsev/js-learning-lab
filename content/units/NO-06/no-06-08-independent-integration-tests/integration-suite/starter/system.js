// The system under test (read-only): the planner API, the web adapter and the shared data layer.
import http from 'node:http';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const SEED = [
  { id: 't-01', title: '%%plants%%', dueDate: '2026-03-02', done: false },
  { id: 't-02', title: '%%library%%', dueDate: '2026-03-01', done: false },
  { id: 't-03', title: '%%grandma%%', dueDate: null, done: false },
];

// A new, empty data file path inside this folder. Give every server its own (one per test).
export function freshDataFile() {
  const dir = new URL('./.data/', import.meta.url);
  mkdirSync(dir, { recursive: true });
  return new URL(`tasks-${randomUUID()}.json`, dir);
}

// Starts the planner API on a loopback port (a free one unless `port` is given). Its data lives in `dataFile` (created with the seed
// tasks when missing), so a server started again with the same file sees the same tasks.
// Returns { base, stop(), failNext(count, status) }: failNext makes the next `count` requests answer `status`.
async function realStartServer({ dataFile, port = 0 }) {
  if (!existsSync(dataFile)) writeFileSync(dataFile, JSON.stringify(SEED));
  const load = () => JSON.parse(readFileSync(dataFile, 'utf8'));
  const save = (tasks) => writeFileSync(dataFile, JSON.stringify(tasks));
  let failures = { count: 0, status: 500 };
  const send = (response, status, value) => {
    response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(value));
  };
  const server = http.createServer(async (request, response) => {
    if (failures.count > 0) {
      failures.count -= 1;
      return send(response, failures.status, { error: { code: 'REHEARSED_FAILURE' } });
    }
    const [version, collection, id] = request.url.split('/').filter((part) => part !== '');
    if (version !== 'v1' || collection !== 'records') return send(response, 404, { error: { code: 'NOT_FOUND' } });
    const tasks = load();
    if (request.method === 'GET' && id === undefined) return send(response, 200, tasks);
    let text = '';
    for await (const chunk of request) text += chunk;
    const body = JSON.parse(text || '{}');
    if (request.method === 'POST' && id === undefined) {
      const task = { id: `t-${randomUUID().slice(0, 8)}`, title: body.title, dueDate: body.dueDate ?? null, done: false };
      save([...tasks, task]);
      return send(response, 201, task);
    }
    const task = tasks.find((item) => item.id === id);
    if (request.method !== 'PATCH' || !task) return send(response, 404, { error: { code: 'NOT_FOUND' } });
    Object.assign(task, body);
    save(tasks);
    send(response, 200, task);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    async stop() {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
    failNext(count, status = 500) {
      failures = { count, status };
    },
  };
}

// A stand-in for the browser's localStorage: keep one and pass it to every reload of the client.
export function createMemoryStorage() {
  const map = new Map();
  return { async get(key) { return map.get(key) ?? null; }, async set(key, value) { map.set(key, value); } };
}

// The web adapter: base URL, storage and network status.
export function createWebAdapter({ baseUrl, storage, online = true }) {
  return { baseUrl, storage, isOnline: async () => online };
}

const CACHE_KEY = 'planner.records.v1';

// The shared data layer.
// listRecords() → { records, stale, failure }: fresh server data (stale false, failure null), or the last
//   saved copy marked stale, with failure 'offline' | 'unavailable' | 'http' | 'invalid'.
// createRecord({ title, dueDate }) and updateRecord(id, changes) → the server's record; they reject on
//   a status that is not ok (with error.status).
function realCreateDataLayer(adapter) {
  async function fromCache(failure) {
    const saved = await adapter.storage.get(CACHE_KEY);
    return { records: saved === null ? [] : JSON.parse(saved), stale: true, failure };
  }
  async function write(method, path, body) {
    const response = await fetch(`${adapter.baseUrl}${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(1000),
    });
    if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status });
    return response.json();
  }
  return {
    async listRecords() {
      if (!(await adapter.isOnline())) return fromCache('offline');
      let response;
      try {
        response = await fetch(`${adapter.baseUrl}/v1/records`, { signal: AbortSignal.timeout(1000) });
      } catch {
        return fromCache('unavailable');
      }
      if (!response.ok) return fromCache('http');
      const records = await response.json();
      if (!Array.isArray(records)) return fromCache('invalid');
      await adapter.storage.set(CACHE_KEY, JSON.stringify(records));
      return { records, stale: false, failure: null };
    },
    createRecord: (input) => write('POST', '/v1/records', input),
    updateRecord: (id, changes) => write('PATCH', `/v1/records/${encodeURIComponent(id)}`, changes),
  };
}

// A domain function: pending tasks due on or before `day`.
export function countDue(tasks, day) {
  return tasks.filter((task) => !task.done && task.dueDate !== null && task.dueDate <= day).length;
}

// --- For the course checks only: they run your tests against other versions of the system. ---
const overrides = {};
export const __checks = {
  realStartServer,
  realCreateDataLayer,
  CACHE_KEY,
  use(next) {
    for (const key of Object.keys(overrides)) delete overrides[key];
    Object.assign(overrides, next);
  },
};
export const startServer = (options) => (overrides.startServer ?? realStartServer)(options);
export const createDataLayer = (adapter) => (overrides.createDataLayer ?? realCreateDataLayer)(adapter);
