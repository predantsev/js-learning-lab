// Evidence probe: what Node's permission model enforces ON ITS OWN on the running Node version
// (no platform guard, no OS sandbox). Prints one JSON object. Run with any Node:
//   node tests/unit/probes/node-permission-probe.mjs
//   npx -y node@22 tests/unit/probes/node-permission-probe.mjs
// It makes no outside network connections: network checks only bind/listen and resolve "localhost".
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const flags = process.allowedNodeEnvironmentFlags;
const permission = flags.has('--permission') ? '--permission' : flags.has('--experimental-permission') ? '--experimental-permission' : null;
const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'jsll-probe-')));
const ws = path.join(root, 'ws');
fs.mkdirSync(ws);
const outside = path.join(root, 'outside.txt');
fs.writeFileSync(outside, 'secret');
// A database outside the workspace, created by this (unrestricted) process.
const outsideDb = path.join(root, 'outside.db');
try {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(outsideDb);
  db.exec("create table secret(v text); insert into secret values ('top secret')");
  db.close();
} catch {
  /* no node:sqlite */
}

function child(source, extraFlags = []) {
  fs.writeFileSync(path.join(ws, 'probe.mjs'), source);
  const r = spawnSync(process.execPath, [permission, `--allow-fs-read=${ws}`, `--allow-fs-write=${ws}`, '--disable-warning=ExperimentalWarning', '--disable-warning=SecurityWarning', ...extraFlags, path.join(ws, 'probe.mjs')], { cwd: ws, env: { NO_COLOR: '1' }, encoding: 'utf8', timeout: 20000 });
  try {
    return JSON.parse(r.stdout.trim().split('\n').pop());
  } catch {
    // An error thrown asynchronously by Node itself ends the process: report its code.
    const code = /code: '([A-Z_]+)'/.exec(r.stderr);
    return { crashedWith: code ? code[1] : `exit ${r.status} ${r.signal ?? ''}`.trim() };
  }
}

const tryAll = (checks) => `
const out = {};
const run = async (name, fn) => { try { const v = await fn(); out[name] = v === undefined ? 'allowed' : 'allowed: ' + v; } catch (e) { out[name] = e.code ?? e.message; } };
${checks}
console.log(JSON.stringify(out));
process.exit(0);`;

const result = { node: process.version, platform: `${process.platform}-${process.arch}`, permissionFlag: permission };
result.flags = Object.fromEntries(['--permission', '--experimental-permission', '--allow-fs-read', '--allow-fs-write', '--allow-child-process', '--allow-worker', '--allow-addons', '--allow-wasi', '--allow-inspector', '--allow-net', '--experimental-strip-types', '--disable-warning'].map((f) => [f, flags.has(f)]));
result.typescript = process.features.typescript ?? false;

if (permission) {
  result.filesystem = child(tryAll(`
import fs from 'node:fs';
await run('readOutside', () => fs.readFileSync(${JSON.stringify(outside)}, 'utf8'));
await run('writeOutside', () => fs.writeFileSync('../written.txt', 'x'));
await run('symlinkToOutside', () => fs.symlinkSync(${JSON.stringify(outside)}, 'link'));
await run('hardlinkToOutside', () => fs.linkSync(${JSON.stringify(outside)}, 'hard'));
await run('writeInside', () => fs.writeFileSync('inside.txt', 'ok'));`));
  result.processes = child(tryAll(`
await run('childProcess', async () => (await import('node:child_process')).execFileSync('true'));
await run('worker', async () => { const { Worker } = await import('node:worker_threads'); new Worker('1', { eval: true }).terminate(); });
await run('addon', () => process.dlopen({ exports: {} }, './x.node'));
await run('wasi', async () => { new (await import('node:wasi')).WASI({ version: 'preview1' }); });
await run('inspector', async () => (await import('node:inspector')).open(0));
await run('signalParent', () => process.kill(process.ppid, 0));`));
  result.sqlite = child(tryAll(`
const { DatabaseSync } = await import('node:sqlite');
await run('openOutside', () => { new DatabaseSync('../escaped.db').exec('create table t(x)'); });
await run('attachOutside', () => { new DatabaseSync(':memory:').exec("ATTACH DATABASE '../attached.db' AS a; create table a.t(x)"); });
await run('readOutsideDatabase', () => new DatabaseSync(${JSON.stringify(outsideDb)}, { readOnly: true }).prepare('select v from secret').get().v);`));
  result.sqlite.filesCreatedOutside = ['escaped.db', 'attached.db'].filter((f) => fs.existsSync(path.join(root, f)));
  if (flags.has('--allow-worker')) {
    result.workerExecArgv = child(tryAll(`
const { Worker } = await import('node:worker_threads');
const inWorker = (execArgv) => new Promise((resolve) => { const w = new Worker('const { parentPort } = require("node:worker_threads"); let r; try { require("node:fs").readFileSync(${JSON.stringify(JSON.stringify(outside)).slice(1, -1)}, "utf8"); r = "allowed"; } catch (e) { r = e.code; } parentPort.postMessage(r);', { eval: true, execArgv }); w.on('message', (m) => { resolve(m); w.terminate(); }); w.on('error', (e) => resolve(e.code)); });
out.inheritedExecArgv_readOutside = await inWorker(undefined);
out.emptyExecArgv_readOutside = await inWorker([]);`), ['--allow-worker']);
  }
  const netChecks = {
    listenLoopback: "await run('listenLoopback', () => new Promise((resolve, reject) => { const s = require('node:net').createServer(); s.on('error', reject); s.listen(0, '127.0.0.1', () => { s.close(); resolve('127.0.0.1'); }); }));",
    listenAllInterfaces: "await run('listenAllInterfaces', () => new Promise((resolve, reject) => { const s = require('node:net').createServer(); s.on('error', reject); s.listen(0, '0.0.0.0', () => { s.close(); resolve('0.0.0.0'); }); }));",
    dnsLocalhost: "await run('dnsLocalhost', async () => (await require('node:dns/promises').lookup('localhost')).address);",
  };
  const network = (extra) => Object.fromEntries(Object.entries(netChecks).map(([name, check]) => {
    const r = child(tryAll(`import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);\n${check}`), extra);
    return [name, r[name] ?? r.crashedWith];
  }));
  result.networkWithoutAllowNet = network([]);
  if (flags.has('--allow-net')) result.networkWithAllowNet = network(['--allow-net']);
}
fs.rmSync(root, { recursive: true, force: true });
console.log(JSON.stringify(result, null, 2));
