// Operating the bookmarks service: configuration, health and shutdown, restore check, contract check.
import http from 'node:http';
import path from 'node:path';
import { schemaErrors } from './contract.js';
import { readBookmarks, summaryOf } from './store.js';

const RULES = [
  ['port', 'PORT', '7374', (t) => (/^\d+$/.test(t) && +t >= 1 && +t <= 65535 ? +t : undefined)],
  ['host', 'HOST', '127.0.0.1', (t) => (['127.0.0.1', '::1'].includes(t) ? t : undefined)],
  ['dataDir', 'DATA_DIR', '', (t) => (path.isAbsolute(t) ? t : undefined)],
  ['deadlineMs', 'DEADLINE_MS', '5000', (t) => (/^\d+$/.test(t) && +t >= 100 && +t <= 30000 ? +t : undefined)],
];

// Each rule turns the text into a value, or gives undefined for an invalid one.
export function loadConfig(env) {
  const config = {};
  const bad = [];
  for (const [key, name, fallback, parse] of RULES) {
    const text = env[name] ?? fallback;
    const value = parse(text);
    if (value === undefined) bad.push(`${name}="${text}"`);
    else config[key] = value;
  }
  if (bad.length) throw new Error(`Invalid configuration: ${bad.join(', ')}`);
  return Object.freeze(config);
}

export async function startService(config, { store, exit, log }) {
  let shuttingDown = false;
  let lastId = 0;

  const server = http.createServer(async (request, response) => {
    const requestId = `r-${++lastId}`;
    const started = performance.now();
    const route = request.url.split('?')[0];
    const send = (status, body) => {
      const headers = { 'content-type': 'application/json', 'x-request-id': requestId };
      if (shuttingDown) headers.connection = 'close';
      response.writeHead(status, headers);
      response.end(JSON.stringify(body));
      log({ requestId, route, status, ms: Math.round((performance.now() - started) * 100) / 100 });
    };
    try {
      if (route === '/livez') return send(200, { status: 'alive' });
      if (route === '/readyz') return store.isReady() && !shuttingDown ? send(200, { status: 'ready' }) : send(503, { status: 'not ready' });
      if (route === '/bookmarks' && request.method === 'GET') return send(200, store.list());
      if (route === '/bookmarks' && request.method === 'POST') {
        let text = '';
        for await (const chunk of request) text += chunk;
        let input;
        try {
          input = JSON.parse(text);
        } catch {
          return send(400, { error: 'body is not JSON' });
        }
        const valid = (value) => typeof value === 'string' && value.trim() !== '';
        if (!valid(input?.title) || !valid(input?.url)) return send(400, { error: 'title and url are required' });
        return send(201, await store.add({ title: input.title.trim(), url: input.url.trim() }));
      }
      return send(404, { error: 'not found' });
    } catch {
      return send(500, { error: 'internal error', requestId });
    }
  });

  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    process.off('SIGTERM', shutdown);
    process.off('SIGINT', shutdown);
    log({ event: 'shutdown', signal, deadlineMs: config.deadlineMs });
    const closed = new Promise((resolve) => server.close(() => resolve('closed')));
    server.closeIdleConnections();
    let timer;
    const outcome = await Promise.race([closed, new Promise((resolve) => { timer = setTimeout(resolve, config.deadlineMs, 'deadline'); })]);
    clearTimeout(timer);
    if (outcome === 'deadline') {
      server.closeAllConnections();
      log({ event: 'shutdown', result: 'deadline passed' });
      exit(1);
      return;
    }
    await store.flush();
    exit(0);
  }
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  await new Promise((resolve) => server.listen(config.port, config.host, resolve));
  const { port } = server.address();
  return { url: `http://${config.host === '::1' ? '[::1]' : config.host}:${port}` };
}

export async function verifyRestore(sourceDir, restoredDir) {
  const restored = await readBookmarks(restoredDir).catch(() => null);
  if (!restored) return { ok: false, problems: ['unreadable restore'] };
  const source = await readBookmarks(sourceDir);
  const ids = (list) => list.map((b) => b.id).sort().join(' ');
  const problems = [];
  if (ids(source) !== ids(restored)) problems.push(`ids: [${ids(source)}] vs [${ids(restored)}]`);
  if (JSON.stringify(summaryOf(source)) !== JSON.stringify(summaryOf(restored))) problems.push('summary differs');
  return { ok: problems.length === 0, problems };
}

export async function checkContract(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/bookmarks`, { signal: AbortSignal.timeout(2000) });
    if (response.status !== 200) return [`GET /bookmarks: status ${response.status}, expected 200`];
    return schemaErrors(await response.json());
  } catch (error) {
    return [`GET /bookmarks failed: ${error.cause?.code ?? error.message}`];
  }
}
