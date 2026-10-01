// Shared helpers for the server unit tests: a real server on an ephemeral loopback port with
// throwaway data/exports/runtime folders, and small request helpers.
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { startServer } from '../../server/app.mjs';

export async function startTestServer(overrides = {}) {
  const tmp = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-unit-')));
  const server = await startServer({ port: 0, quiet: true, dataDir: path.join(tmp, 'data'), exportsDir: path.join(tmp, 'exports'), runtimeDir: path.join(tmp, 'runtime'), ...overrides });
  const base = `http://localhost:${server.port}`;
  const token = server.store.meta.token;
  return {
    server,
    tmp,
    base,
    token,
    headers: { 'x-jsll-token': token, 'content-type': 'application/json' },
    async close() {
      await server.close();
      await fs.rm(tmp, { recursive: true, force: true });
    },
  };
}

export async function api(ctx, method, route, body) {
  const res = await fetch(ctx.base + route, { method, headers: ctx.headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  return { status: res.status, json, text, headers: res.headers };
}

/** POST /api/node/run and collect the NDJSON events. `onEvent` sees each event as it arrives. */
export async function runNode(ctx, body, { onEvent, signal } = {}) {
  const res = await fetch(`${ctx.base}/api/node/run`, { method: 'POST', headers: ctx.headers, body: JSON.stringify(body), signal });
  if (!res.headers.get('content-type')?.startsWith('application/x-ndjson')) return { status: res.status, error: await res.json().catch(() => null), events: [] };
  const events = [];
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let i;
    while ((i = buffer.indexOf('\n')) >= 0) {
      const event = JSON.parse(buffer.slice(0, i));
      buffer = buffer.slice(i + 1);
      events.push(event);
      await onEvent?.(event);
    }
  }
  const of = (type) => events.filter((e) => e.type === type);
  return {
    status: res.status,
    contentType: res.headers.get('content-type'),
    events,
    start: of('start')[0],
    stdout: of('stdout').map((e) => e.data).join(''),
    stderr: of('stderr').map((e) => e.data).join(''),
    tests: of('tests')[0],
    exit: of('exit')[0],
  };
}

/** Raw request with arbitrary Host/Origin headers (fetch forbids setting Host). */
export function rawRequest(port, { method = 'GET', path: route = '/', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path: route, headers, agent: false }, (res) => {
      let text = '';
      res.on('data', (c) => { text += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, text }));
    });
    req.on('error', reject);
    req.end(body);
  });
}

export const waitUntil = async (check, { timeout = 3000, interval = 20 } = {}) => {
  const start = Date.now();
  for (;;) {
    if (await check()) return true;
    if (Date.now() - start > timeout) return false;
    await new Promise((r) => setTimeout(r, interval));
  }
};
