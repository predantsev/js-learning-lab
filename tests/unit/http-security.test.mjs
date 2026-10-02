// Local API boundary: loopback binding, Host allowlist (DNS rebinding), Origin and token checks.
import assert from 'node:assert/strict';
import net from 'node:net';
import os from 'node:os';
import { after, before, test } from 'node:test';
import { rawRequest, startTestServer } from './helpers.mjs';

let ctx;
let port;
before(async () => {
  ctx = await startTestServer();
  port = ctx.server.port;
});
after(async () => {
  await ctx?.close();
});

const appHost = () => `localhost:${port}`;

test('a valid request from the application succeeds', async () => {
  const res = await rawRequest(port, { path: '/api/bootstrap', headers: { host: appHost(), 'x-jsll-token': ctx.token } });
  assert.equal(res.status, 200);
  const body = JSON.parse(res.text);
  assert.equal(body.schemaVersion, 1);
  assert.ok(body.features.isolatedNode);
});

test('unknown Host headers are refused (DNS rebinding)', async () => {
  for (const host of [`evil.example:${port}`, `attacker.localhost:${port}`, `localhost:${port + 1}`, `192.168.1.10:${port}`]) {
    const res = await rawRequest(port, { path: '/api/bootstrap', headers: { host, 'x-jsll-token': ctx.token } });
    assert.equal(res.status, 421, host);
    assert.doesNotMatch(res.text, new RegExp(ctx.token));
  }
});

test('the API is not served on sandbox hosts', async () => {
  for (const host of [`127.0.0.1:${port}`, `jsll-run-1.localhost:${port}`]) {
    const res = await rawRequest(port, { path: '/api/bootstrap', headers: { host, 'x-jsll-token': ctx.token } });
    assert.equal(res.status, 302, host);
    assert.doesNotMatch(res.text, /schemaVersion/);
  }
});

test('cross-origin requests are refused even with the token', async () => {
  for (const origin of ['http://evil.example', 'null', `http://127.0.0.1:${port}`, `http://jsll-run-1.localhost:${port}`]) {
    const res = await rawRequest(port, { method: 'POST', path: '/api/node/run', headers: { host: appHost(), origin, 'x-jsll-token': ctx.token, 'content-type': 'application/json' }, body: '{}' });
    assert.equal(res.status, 403, origin);
  }
  const same = await rawRequest(port, { path: '/api/bootstrap', headers: { host: appHost(), origin: `http://localhost:${port}`, 'x-jsll-token': ctx.token } });
  assert.equal(same.status, 200);
});

test('requests without the local token are refused', async () => {
  for (const headers of [{}, { 'x-jsll-token': '' }, { 'x-jsll-token': 'wrong' }, { 'x-jsll-token': `${ctx.token}x` }]) {
    for (const route of ['/api/bootstrap', '/api/backup/create', '/api/node/run', '/api/export/folder', '/api/typecheck']) {
      const res = await rawRequest(port, { method: route === '/api/bootstrap' ? 'GET' : 'POST', path: route, headers: { host: appHost(), ...headers } });
      assert.equal(res.status, 401, `${route} ${JSON.stringify(headers)}`);
    }
  }
});

test('static paths: traversal, encoded traversal, NUL and malformed encoding never leave the served folder', async () => {
  // Malformed percent-encoding used to throw inside serveStatic (500 + a server log line).
  const appCases = ['/../package.json', '/%2e%2e/package.json', '/%2e%2e%2fpackage.json', '/..%5cpackage.json', '/content/..%2f..%2fpackage.json', '/%00', '/assets/%E0%A4%A', '/content/%'];
  for (const route of appCases) {
    const res = await rawRequest(port, { path: route, headers: { host: appHost() } });
    assert.equal(res.status, 404, route);
    assert.doesNotMatch(res.text, /"name": "js-learning-lab"/, route);
  }
  // On a sandbox host a path normalized out of /sandbox/ is redirected to the app; nothing is read.
  for (const route of ['/sandbox/..%2f..%2fpackage.json', '/sandbox/%2e%2e/%2e%2e/package.json', '/sandbox/%']) {
    const res = await rawRequest(port, { path: route, headers: { host: `jsll-run-1.localhost:${port}` } });
    assert.ok([302, 404].includes(res.status), `${route} → ${res.status}`);
    assert.doesNotMatch(res.text, /"name": "js-learning-lab"/, route);
  }
});

test('the server listens on loopback only', async (t) => {
  const lan = Object.values(os.networkInterfaces()).flat().find((i) => i && i.family === 'IPv4' && !i.internal);
  if (!lan) return t.skip('no non-loopback IPv4 interface on this machine');
  const outcome = await new Promise((resolve) => {
    const socket = net.connect(port, lan.address);
    socket.once('connect', () => { socket.destroy(); resolve('connected'); });
    socket.once('error', (error) => resolve(error.code));
    socket.setTimeout(2000, () => { socket.destroy(); resolve('timeout'); });
  });
  assert.notEqual(outcome, 'connected', `port ${port} must not accept connections on ${lan.address}`);
});
