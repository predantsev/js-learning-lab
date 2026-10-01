// Isolated real-Node executor (REQ-021–023, REQ-032, DEC-12): real output, limits, interruption,
// filesystem/process/network policy, the private test-result channel and the harness helpers.
// Every assertion runs real child processes on the Node that runs this suite (process.execPath).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { createNodeRunner, detectNodeSupport, validateRunRequest } from '../../server/api/lib/node-runner.mjs';
import { ROOT } from '../../server/config.mjs';
import { api, runNode, startTestServer, waitUntil } from './helpers.mjs';

const support = detectNodeSupport();
let ctx;
before(async () => {
  ctx = await startTestServer();
});
after(async () => {
  await ctx?.close();
});

const run = (body) => runNode(ctx, { entry: 'index.js', ...body });
const OUTSIDE = path.join(ROOT, 'server', 'config.mjs');

describe('availability', () => {
  test('the feature describes what this Node enforces', () => {
    const f = ctx.server.api.features.isolatedNode;
    assert.equal(f.available, true, f.reason);
    assert.equal(f.node, process.version);
    assert.ok(f.flags.includes(support.permissionFlag));
    assert.deepEqual(f.enforcement.fsRead, ['node-permission']);
    assert.equal(f.enforcement.networkNone.includes('node-permission'), support.allowNet);
    assert.ok(f.limitations.some((l) => l.includes('node:sqlite')));
  });

  test('without a permission model nothing is executed (501)', async () => {
    const runner = await createNodeRunner({ runtimeDir: path.join(ctx.tmp, 'no-perm'), support: { ...support, permissionFlag: null } });
    assert.equal(runner.feature.available, false);
    assert.match(runner.feature.reason, /never run without isolation/);
    await assert.rejects(runner.start(validateRunRequest({ files: { 'a.js': '' }, entry: 'a.js' }), () => {}), (error) => error.status === 501);
  });
});

describe('real execution', () => {
  test('learner code produces real output, and edits change it', async () => {
    const a = await run({ files: { 'index.js': 'console.log(6 * 7);' } });
    assert.equal(a.status, 200);
    assert.equal(a.contentType, 'application/x-ndjson; charset=utf-8');
    assert.equal(a.start.node, process.version);
    assert.equal(a.stdout, '42\n');
    assert.deepEqual({ code: a.exit.code, timedOut: a.exit.timedOut, truncated: a.exit.truncated, reason: a.exit.reason }, { code: 0, timedOut: false, truncated: false, reason: 'exited' });
    const b = await run({ files: { 'index.js': 'console.log(6 * 8); console.error("warn"); process.exitCode = 3;' } });
    assert.equal(b.stdout, '48\n');
    assert.equal(b.stderr, 'warn\n');
    assert.equal(b.exit.code, 3);
  });

  test('multi-file ES modules, JSON imports, stdin and arguments', async () => {
    const r = await run({
      files: {
        'index.js': 'import { total } from "./lib/math.js";\nimport data from "./data.json" with { type: "json" };\nlet input = "";\nfor await (const chunk of process.stdin) input += chunk;\nconsole.log(total(data.items), input.trim(), process.argv.slice(2).join(","));',
        'lib/math.js': 'export const total = (xs) => xs.reduce((a, b) => a + b, 0);',
        'data.json': '{"items":[1,2,3]}',
      },
      stdin: 'hello from stdin\n',
      args: ['--limit', '5'],
    });
    assert.equal(r.stdout, '6 hello from stdin --limit,5\n');
  });

  test('the scratch workspace is the working directory and is deleted afterwards', async () => {
    const r = await run({ files: { 'index.js': 'import fs from "node:fs"; fs.writeFileSync("out.txt", "x"); console.log(process.cwd() === import.meta.dirname, fs.readdirSync(".").sort().join(","));' } });
    assert.equal(r.stdout, 'true .tmp,index.js,out.txt,package.json\n');
    assert.ok(r.start.cwd.includes(`${path.sep}node-runs${path.sep}`));
    assert.equal(existsSync(r.start.cwd), false);
  });

  test('the environment is clean: no platform token, data path or parent variables', async () => {
    const r = await run({ files: { 'index.js': 'console.log(JSON.stringify(process.env));' } });
    const env = JSON.parse(r.stdout);
    const allowed = new Set(['NO_COLOR', 'TMPDIR', '__CF_USER_TEXT_ENCODING', 'TEMP', 'TMP', 'SystemRoot', 'SYSTEMROOT', 'windir']);
    assert.deepEqual(Object.keys(env).filter((k) => !allowed.has(k)), []);
    assert.equal(env.NO_COLOR, '1');
    assert.ok(env.TMPDIR.startsWith(r.start.cwd));
    assert.ok(!r.stdout.includes(ctx.token));
    assert.ok(!r.stdout.includes(ctx.server.config.dataDir));
  });

  test('TypeScript runs through Node type stripping', async (t) => {
    if (!support.typescript) return t.skip(`Node ${process.version} has no type stripping`);
    const r = await runNode(ctx, { entry: 'main.ts', files: { 'main.ts': 'type Item = { name: string };\nconst items: Item[] = [{ name: "a" }];\nconsole.log(items.map((i): string => i.name).join());' } });
    assert.equal(r.stdout, 'a\n');
  });

  test('a bare package import explains that npm packages are not installed', async () => {
    const r = await run({ files: { 'index.js': 'import "react";' } });
    assert.match(r.stderr, /Cannot find package 'react'.*does not install npm packages/s);
    assert.notEqual(r.exit.code, 0);
  });
});

describe('limits and interruption', () => {
  test('a runaway loop is killed at the timeout', async () => {
    const r = await run({ files: { 'index.js': 'console.log("start"); for (;;) {}' }, timeoutMs: 700 });
    assert.equal(r.stdout, 'start\n');
    assert.equal(r.exit.timedOut, true);
    assert.equal(r.exit.reason, 'timeout');
    assert.equal(r.exit.signal, 'SIGKILL');
    assert.ok(r.exit.durationMs >= 650 && r.exit.durationMs < 5000, String(r.exit.durationMs));
  });

  test('an output flood is cut at the cap and the process is killed', async () => {
    const r = await run({ files: { 'index.js': 'const line = "x".repeat(999); for (;;) console.log(line);' } });
    assert.equal(r.exit.truncated, true, `${JSON.stringify(r.exit)} ${r.stderr.slice(0, 400)}`);
    assert.equal(r.exit.reason, 'output-limit');
    const bytes = Buffer.byteLength(r.stdout + r.stderr);
    assert.ok(bytes <= 200 * 1024 && bytes > 150 * 1024, String(bytes));
  });

  test('the JavaScript heap is capped', async () => {
    const r = await run({ files: { 'index.js': 'const keep = []; for (;;) keep.push(new Array(1e6).fill(Math.random()));' }, timeoutMs: 20000 });
    assert.notEqual(r.exit.code, 0);
    assert.equal(r.exit.timedOut, false);
    assert.equal(r.exit.reason, r.exit.signal ? 'crashed' : 'exited');
    assert.match(r.stderr, /heap/i);
  });

  test('writing more than the workspace limit stops the run', async () => {
    const r = await run({ files: { 'index.js': 'import fs from "node:fs"; const mb = Buffer.alloc(1024 * 1024, 1); for (let i = 0; i < 80; i++) fs.appendFileSync("big.bin", mb); setTimeout(() => {}, 5000);' } });
    assert.equal(r.exit.reason, 'workspace-limit');
  });

  test('POST /api/node/stop interrupts a run by runId', async () => {
    let stopAnswer = null;
    let runId = null;
    const result = await runNode(ctx, { entry: 'index.js', files: { 'index.js': 'setInterval(() => console.log("tick"), 50);' }, timeoutMs: 20000 }, {
      onEvent: async (event) => {
        if (event.type === 'start') runId = event.runId;
        if (event.type === 'stdout' && stopAnswer === null) {
          stopAnswer = 'pending';
          stopAnswer = (await api(ctx, 'POST', '/api/node/stop', { runId })).json;
        }
      },
    });
    assert.deepEqual(stopAnswer, { stopped: true });
    assert.equal(result.exit.reason, 'stopped');
    assert.equal(result.exit.stopped, true);
    assert.equal((await api(ctx, 'POST', '/api/node/stop', { runId })).json.stopped, false);
  });

  test('a dropped client connection kills the run', async () => {
    const controller = new AbortController();
    const runner = ctx.server.api.nodeRunner;
    await runNode(ctx, { entry: 'index.js', files: { 'index.js': 'for (;;) {}' }, timeoutMs: 30000 }, {
      signal: controller.signal,
      onEvent: (event) => { if (event.type === 'start') controller.abort(); },
    }).catch((error) => assert.equal(error.name, 'AbortError'));
    assert.ok(await waitUntil(() => runner.runs.size === 0, { timeout: 5000 }), 'the run should end after the client disconnects');
  });

  test('at most two runs at a time; the third gets 429 busy', async () => {
    const runner = ctx.server.api.nodeRunner;
    const ids = [];
    const long = () => runNode(ctx, { entry: 'index.js', files: { 'index.js': 'setInterval(() => {}, 1000);' }, timeoutMs: 20000 }, { onEvent: (e) => { if (e.type === 'start') ids.push(e.runId); } });
    const first = long();
    const second = long();
    assert.ok(await waitUntil(() => ids.length === 2));
    const third = await runNode(ctx, { entry: 'index.js', files: { 'index.js': '' } });
    assert.equal(third.status, 429);
    assert.equal(third.error.error, 'busy');
    for (const id of ids) runner.stop(id);
    const [a, b] = await Promise.all([first, second]);
    assert.equal(a.exit.reason, 'stopped');
    assert.equal(b.exit.reason, 'stopped');
  });

  test('unsafe paths and bad requests are rejected before anything runs', async () => {
    for (const files of [{ '../x.js': '' }, { '/etc/x.js': '' }, { 'a\\b.js': '' }, { 'a\u0000.js': '' }, { '.git/config': '' }, { 'A.js': '', 'a.js': '' }]) {
      const r = await runNode(ctx, { entry: Object.keys(files)[0], files });
      assert.equal(r.status, 400, JSON.stringify(files));
    }
    const many = Object.fromEntries(Array.from({ length: 201 }, (_, i) => [`f${i}.js`, '']));
    assert.equal((await runNode(ctx, { entry: 'f0.js', files: many })).status, 413);
    assert.equal((await runNode(ctx, { entry: 'missing.js', files: { 'a.js': '' } })).status, 400);
    assert.equal((await run({ files: { 'index.js': '' }, timeoutMs: 60001 })).status, 400);
    assert.equal((await run({ files: { 'index.js': '' }, capabilities: { network: 'internet' } })).status, 400);
  });
});

describe('isolation', () => {
  test('files outside the workspace cannot be read or written', async () => {
    const r = await run({
      files: {
        'index.js': `import fs from "node:fs";
const tries = {
  read: () => fs.readFileSync(${JSON.stringify(OUTSIDE)}),
  list: () => fs.readdirSync(${JSON.stringify(path.dirname(OUTSIDE))}),
  write: () => fs.writeFileSync("../escape.txt", "x"),
  symlink: () => fs.symlinkSync(${JSON.stringify(OUTSIDE)}, "link.js"),
  hardlink: () => fs.linkSync(${JSON.stringify(OUTSIDE)}, "hard.js"),
};
for (const [name, fn] of Object.entries(tries)) { try { fn(); console.log(name, "ALLOWED"); } catch (e) { console.log(name, e.code); } }`,
      },
    });
    assert.equal(r.stdout, ['read', 'list', 'write', 'symlink', 'hardlink'].map((n) => `${n} ERR_ACCESS_DENIED\n`).join(''));
  });

  test('child processes, native addons, WASI and the inspector are denied', async () => {
    const r = await run({
      files: {
        'index.js': `const out = [];
const tryIt = async (name, fn) => { try { await fn(); out.push(name + " ALLOWED"); } catch (e) { out.push(name + " " + e.code); } };
await tryIt("exec", async () => (await import("node:child_process")).execSync("echo hi"));
await tryIt("spawn", async () => (await import("node:child_process")).spawnSync("ls"));
await tryIt("addon", () => process.dlopen({ exports: {} }, "./x.node"));
await tryIt("wasi", async () => new (await import("node:wasi")).WASI({ version: "preview1" }));
await tryIt("inspector", async () => (await import("node:inspector")).open(0));
console.log(out.join("\\n"));`,
      },
    });
    const lines = r.stdout.trim().split('\n');
    assert.equal(lines.length, 5, r.stdout + r.stderr);
    for (const line of lines) assert.match(line, / ERR_(ACCESS_DENIED|DLOPEN_DISABLED)$/, line);
  });

  test('signals to other processes are blocked; signalling itself works', async () => {
    const r = await run({ files: { 'index.js': 'try { process.kill(process.ppid, 0); console.log("parent ALLOWED"); } catch (e) { console.log("parent", e.code); }\nconsole.log("self", process.kill(process.pid, 0));' } });
    assert.equal(r.stdout, 'parent ERR_JSLL_POLICY\nself true\n');
  });

  test('worker threads are denied unless requested; requested workers stay inside the permission model', async () => {
    const code = `import { Worker } from "node:worker_threads";
try {
  const w = new Worker(\`const { parentPort } = require("node:worker_threads"); let r; try { require("node:fs").readFileSync(${JSON.stringify(JSON.stringify(OUTSIDE)).slice(1, -1)}); r = "ALLOWED"; } catch (e) { r = e.code; } parentPort.postMessage(r);\`, { eval: true });
  w.on("message", (m) => { console.log("worker read", m); w.terminate(); });
} catch (e) { console.log("worker", e.code); }
try { new Worker("1", { eval: true, execArgv: [] }); console.log("execArgv ALLOWED"); } catch (e) { console.log("execArgv", e.code); }`;
    const denied = await run({ files: { 'index.js': code } });
    assert.match(denied.stdout, /^worker ERR_ACCESS_DENIED\n/);
    const allowed = await run({ files: { 'index.js': code }, capabilities: { workers: true } });
    assert.match(allowed.stdout, /execArgv ERR_JSLL_POLICY/);
    assert.match(allowed.stdout, /worker read ERR_ACCESS_DENIED/);
  });

  test('the platform guard is also loaded inside worker threads', async () => {
    const r = await run({
      capabilities: { workers: true },
      files: { 'index.js': 'import { Worker } from "node:worker_threads";\nconst w = new Worker(`const { parentPort, Worker } = require("node:worker_threads"); const out = []; try { process.kill(process.ppid, 0); out.push("signal ALLOWED"); } catch (e) { out.push("signal " + e.code); } try { new Worker("1", { eval: true, execArgv: [] }); out.push("nested ALLOWED"); } catch (e) { out.push("nested " + e.code); } try { require("node:net").connect(80, "127.0.0.1").on("error", () => {}); out.push("net ALLOWED"); } catch (e) { out.push("net " + e.code); } parentPort.postMessage(out.join(","));`, { eval: true });\nw.on("message", (m) => { console.log(m); w.terminate(); });' },
    });
    assert.equal(r.stdout, 'signal ERR_JSLL_POLICY,nested ERR_JSLL_POLICY,net ERR_JSLL_POLICY\n', r.stderr);
  });

  test('network "none" (default) blocks servers, clients and DNS', async () => {
    const r = await run({
      files: {
        'index.js': `import http from "node:http"; import dns from "node:dns/promises"; import net from "node:net";
const out = [];
try { http.createServer().listen(0, "127.0.0.1"); out.push("listen ALLOWED"); } catch (e) { out.push("listen " + e.code); }
try { net.connect(80, "127.0.0.1").on("error", () => {}); out.push("connect ALLOWED"); } catch (e) { out.push("connect " + e.code); }
try { await fetch("http://127.0.0.1:8080/"); out.push("fetch ALLOWED"); } catch (e) { out.push("fetch " + (e.cause?.code ?? e.code)); }
try { await dns.lookup("example.com"); out.push("dns ALLOWED"); } catch (e) { out.push("dns " + e.code); }
console.log(out.join(","));`,
      },
    });
    assert.equal(r.stdout, 'listen ERR_JSLL_POLICY,connect ERR_JSLL_POLICY,fetch ERR_JSLL_POLICY,dns ERR_JSLL_POLICY\n');
    assert.equal(r.start.policy.network, 'none');
  });

  test('network "loopback": a real local HTTP server works, other hosts are blocked', async () => {
    const r = await run({
      capabilities: { network: 'loopback' },
      files: {
        'index.js': `import http from "node:http"; import net from "node:net";
const server = http.createServer((req, res) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ path: req.url })); });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const viaFetch = await (await fetch(\`http://127.0.0.1:\${port}/a\`)).json();
const viaName = await (await fetch(\`http://localhost:\${port}/b\`).catch(() => fetch(\`http://127.0.0.1:\${port}/b\`))).json();
console.log(viaFetch.path, viaName.path);
const blocked = [];
try { http.createServer().listen(0); blocked.push("no-host ALLOWED"); } catch (e) { blocked.push("no-host " + e.code); }
try { http.createServer().listen(0, "0.0.0.0"); blocked.push("all ALLOWED"); } catch (e) { blocked.push("all " + e.code); }
try { net.connect(80, "192.0.2.1").on("error", () => {}); blocked.push("remote ALLOWED"); } catch (e) { blocked.push("remote " + e.code); }
try { await fetch("http://example.com/"); blocked.push("fetch ALLOWED"); } catch (e) { blocked.push("fetch " + (e.cause?.code ?? e.code)); }
console.log(blocked.join(","));
server.close();`,
      },
    });
    assert.equal(r.stdout, '/a /b\nno-host ERR_JSLL_POLICY,all ERR_JSLL_POLICY,remote ERR_JSLL_POLICY,fetch ERR_JSLL_POLICY\n', r.stderr);
    assert.equal(r.exit.code, 0);
  });

  test('a policy error explains how to bind a server to loopback', async () => {
    const r = await run({ capabilities: { network: 'loopback' }, files: { 'index.js': 'import http from "node:http"; http.createServer().listen(3000);' } });
    assert.match(r.stderr, /server\.listen\(3000, '127\.0\.0\.1'\)/);
  });

  test('node:sqlite works inside the workspace; database paths outside it are refused', async () => {
    const r = await run({
      files: {
        'index.js': `import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync("app.db");
db.exec("create table item (id integer primary key, name text not null)");
const insert = db.prepare("insert into item (name) values (?)");
for (const name of ["book", "lamp"]) insert.run(name);
console.log(JSON.stringify(db.prepare("select name from item order by id").all()));
db.close();
const tries = {
  outside: () => new DatabaseSync("../outside.db"),
  absolute: () => new DatabaseSync(${JSON.stringify(path.join(ROOT, 'jsll-should-not-exist.db'))}),
  attach: () => new DatabaseSync(":memory:").exec("ATTACH DATABASE '../x.db' AS x"),
  vacuumInto: () => new DatabaseSync(":memory:").exec("VACUUM INTO '../y.db'"),
};
for (const [name, fn] of Object.entries(tries)) { try { fn(); console.log(name, "ALLOWED"); } catch (e) { console.log(name, e.code); } }`,
      },
    });
    assert.equal(r.stdout, '[{"name":"book"},{"name":"lamp"}]\noutside ERR_JSLL_POLICY\nabsolute ERR_JSLL_POLICY\nattach ERR_JSLL_POLICY\nvacuumInto ERR_JSLL_POLICY\n', r.stderr);
    assert.equal(existsSync(path.join(ROOT, 'jsll-should-not-exist.db')), false);
  });

  test('node:http, node:fs, node:stream, node:crypto and node:events work in the workspace', async () => {
    const r = await run({
      files: {
        'index.js': `import { createHash } from "node:crypto"; import { EventEmitter, once } from "node:events"; import fs from "node:fs/promises";
import { Readable, Transform } from "node:stream"; import { pipeline } from "node:stream/promises"; import { createWriteStream } from "node:fs";
const upper = new Transform({ transform(chunk, _enc, cb) { cb(null, chunk.toString().toUpperCase()); } });
await pipeline(Readable.from(["a", "b"]), upper, createWriteStream("out.txt"));
const e = new EventEmitter(); setTimeout(() => e.emit("ready", 1), 1); const [v] = await once(e, "ready");
console.log(await fs.readFile("out.txt", "utf8"), v, createHash("sha256").update("x").digest("hex").slice(0, 8));`,
      },
    });
    assert.equal(r.stdout, 'AB 1 2d711642\n', r.stderr);
  });
});

describe('what each layer enforces on its own (recorded, not assumed)', () => {
  let runner;
  before(async () => {
    runner = await createNodeRunner({ runtimeDir: path.join(ctx.tmp, 'layers'), osSandbox: false });
  });

  async function rawChild(source, { network = 'none', profile = null } = {}) {
    const workspace = await fs.realpath(await fs.mkdtemp(path.join(ctx.tmp, 'raw-')));
    await fs.writeFile(path.join(workspace, 'probe.mjs'), source);
    const spec = { mode: 'run', entry: null, tests: null, args: [], network, workers: false, files: [] };
    const { command, args } = runner.buildCommand({ workspace, spec, profile, guard: false, script: path.join(workspace, 'probe.mjs') });
    return new Promise((resolve) => {
      const child = spawn(command, args, { cwd: workspace, env: { NO_COLOR: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
      let out = '';
      let err = '';
      child.stdout.on('data', (c) => { out += c; });
      child.stderr.on('data', (c) => { err += c; });
      child.on('close', (code) => resolve({ out, err, code, workspace }));
    });
  }

  test('the permission model alone does not contain node:sqlite (known limitation)', async () => {
    const r = await rawChild('import { DatabaseSync } from "node:sqlite"; new DatabaseSync("../escaped.db").exec("create table t(x)"); console.log("opened");');
    assert.equal(r.out, 'opened\n', 'if this fails, Node now contains node:sqlite: update the documented limitation');
    assert.equal(existsSync(path.join(path.dirname(r.workspace), 'escaped.db')), true);
    await fs.rm(path.join(path.dirname(r.workspace), 'escaped.db'), { force: true });
  });

  test('without --allow-net, Node itself blocks the network (Node 25+)', async (t) => {
    if (!support.allowNet) return t.skip(`Node ${process.version} has no --allow-net: network "none" relies on the platform guard${ctx.server.api.nodeRunner.osActive ? ' and Seatbelt' : ' only'}`);
    const r = await rawChild('import dns from "node:dns/promises"; try { await dns.lookup("example.com"); console.log("ALLOWED"); } catch (e) { console.log(e.code); }');
    assert.equal(r.out, 'ERR_ACCESS_DENIED\n');
  });

  test('the macOS Seatbelt layer blocks sqlite reads/writes outside the workspace and signals to other processes', async (t) => {
    if (!ctx.server.api.nodeRunner.osActive) return t.skip(`no OS sandbox layer on ${process.platform}`);
    const { seatbeltProfile, HARNESS_DIR } = await import('../../server/api/lib/node-runner.mjs');
    const workspaceProfile = (ws) => seatbeltProfile({ workspace: ws, readable: [HARNESS_DIR, path.dirname(path.dirname(process.execPath))], nodeBinary: process.execPath, network: 'none' });
    const workspace = await fs.realpath(await fs.mkdtemp(path.join(ctx.tmp, 'sb-')));
    // A database outside the workspace (in the temporary folder) written by this unrestricted process.
    const { DatabaseSync } = await import('node:sqlite');
    const secretDb = path.join(ctx.tmp, 'sb-secret.db');
    const db = new DatabaseSync(secretDb);
    db.exec("create table s(v text); insert into s values ('secret')");
    db.close();
    await fs.writeFile(path.join(workspace, 'probe.mjs'), `const out = []; const { DatabaseSync } = await import("node:sqlite");
try { new DatabaseSync("../sb-escape.db").exec("create table t(x)"); out.push("sqlite-write ALLOWED"); } catch (e) { out.push("sqlite-write " + e.code); }
try { out.push("sqlite-read " + new DatabaseSync(${JSON.stringify(secretDb)}, { readOnly: true }).prepare("select v from s").get().v); } catch (e) { out.push("sqlite-read " + e.code); }
try { process.kill(process.ppid, 0); out.push("signal ALLOWED"); } catch (e) { out.push("signal " + e.code); }
console.log(out.join(","));`);
    const spec = { mode: 'run', entry: null, tests: null, args: [], network: 'none', workers: false, files: [] };
    const { command, args } = runner.buildCommand({ workspace, spec, profile: workspaceProfile(workspace), guard: false, script: path.join(workspace, 'probe.mjs') });
    const out = await new Promise((resolve) => {
      const child = spawn(command, args, { cwd: workspace, env: { NO_COLOR: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
      let text = '';
      child.stdout.on('data', (c) => { text += c; });
      child.on('close', () => resolve(text));
    });
    assert.equal(out, 'sqlite-write ERR_SQLITE_ERROR,sqlite-read ERR_SQLITE_ERROR,signal EPERM\n');
    assert.equal(existsSync(path.join(ctx.tmp, 'sb-escape.db')), false);
  });
});

describe('test mode', () => {
  const testRun = (body) => runNode(ctx, { mode: 'test', ...body });

  test('checks import learner modules with real ESM and report pass/fail with diffs', async () => {
    const r = await testRun({
      entry: 'index.js',
      files: { 'index.js': 'console.log("booted");', 'cart.js': 'export const total = (items) => items.reduce((s, i) => s + i.price * i.qty, 0);' },
      tests: {
        path: 'cart.test.js',
        source: `import { total } from "./cart.js";
test("sums prices", () => { expect(total([{ price: 2, qty: 3 }])).toBe(6); });
test("wrong expectation", () => { expect(total([{ price: 1, qty: 1 }])).toEqual(2); });
test("entry output is visible", () => { expect(logs()).toEqual(["booted"]); });
test("async matchers", async () => { await expect(Promise.resolve(5)).resolves.toBe(5); await expect(Promise.reject(new Error("no"))).rejects.toBeInstanceOf(Error); });
test("spies and throws", () => { const s = spy((x) => x * 2); s(4); expect(s).toHaveBeenCalledWith(4); expect(() => { throw new TypeError("bad"); }).toThrow(TypeError); expect(s).not.toHaveBeenCalledTimes(2); });`,
      },
    });
    assert.equal(r.tests.harnessError, undefined, JSON.stringify(r.tests));
    assert.deepEqual(r.tests.results.map((x) => [x.name, x.status]), [['sums prices', 'pass'], ['wrong expectation', 'fail'], ['entry output is visible', 'pass'], ['async matchers', 'pass'], ['spies and throws', 'pass']]);
    const failed = r.tests.results[1];
    assert.equal(failed.message, 'expected 1 to equal 2');
    assert.deepEqual([failed.actual, failed.expected], [{ t: 'number', v: 1 }, { t: 'number', v: 2 }]);
    assert.ok(r.tests.results.every((x) => typeof x.ms === 'number'));
    assert.equal(r.exit.code, 1);
  });

  test('a real loopback HTTP server is exercised with listen() and request()', async () => {
    const r = await testRun({
      capabilities: { network: 'loopback' },
      files: { 'app.js': 'import http from "node:http";\nexport function createApp() {\n  return http.createServer((req, res) => {\n    if (req.method === "POST" && req.url === "/items") { let body = ""; req.on("data", (c) => (body += c)); req.on("end", () => { res.writeHead(201, { "content-type": "application/json" }); res.end(JSON.stringify({ created: JSON.parse(body).name })); }); return; }\n    res.writeHead(404).end();\n  });\n}' },
      tests: {
        path: 'app.test.js',
        source: `import { createApp } from "./app.js";
test("POST /items creates an item", async () => {
  const base = await listen(createApp());
  const res = await request(base + "/items", { method: "POST", body: { name: "lamp" } });
  expect(res.status).toBe(201);
  expect(res.headers["content-type"]).toBe("application/json");
  expect(res.json).toEqual({ created: "lamp" });
});
test("unknown routes are 404", async () => {
  const res = await request((await listen(createApp())) + "/nope");
  expect(res.status).toBe(404);
});`,
      },
    });
    assert.deepEqual(r.tests.results.map((x) => x.status), ['pass', 'pass'], JSON.stringify(r.tests));
    assert.equal(r.exit.code, 0);
  });

  test('activeResources() shows a leaked server and an empty list after cleanup', async () => {
    const r = await testRun({
      capabilities: { network: 'loopback' },
      files: { 'x.js': 'export {};' },
      tests: {
        path: 'leak.test.js',
        source: `import http from "node:http";
test("baseline is empty", () => { expect(activeResources()).toEqual([]); });
test("an open server is visible", async () => {
  const server = http.createServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  expect(activeResources()).toContain("TCPServerWrap");
  await new Promise((r) => server.close(r));
  // Node drops the closed handle from the list one event-loop turn after the close callback.
  await waitFor(() => activeResources().length === 0);
  expect(activeResources()).toEqual([]);
});
test("tmp() is inside the exercise", async () => { expect(tmp("data/a.json").startsWith(process.cwd())).toBe(true); });`,
      },
    });
    assert.deepEqual(r.tests.results.map((x) => [x.name, x.status, x.message]), [['baseline is empty', 'pass', undefined], ['an open server is visible', 'pass', undefined], ['tmp() is inside the exercise', 'pass', undefined]]);
  });

  test('a hanging test fails at its own timeout while the others still run', async () => {
    const r = await testRun({
      files: { 'x.js': 'export {};' },
      tests: { path: 'hang.test.js', timeoutMs: 200, source: 'test("hangs", () => new Promise(() => {}));\ntest("still runs", () => expect(1).toBe(1));' },
    });
    assert.deepEqual(r.tests.results.map((x) => [x.status, x.message]), [['fail', 'test timed out after 200 ms'], ['pass', undefined]]);
  });

  test('learner output cannot forge results', async () => {
    const r = await testRun({
      entry: 'index.js',
      files: { 'index.js': `import fs from "node:fs";
console.log(JSON.stringify({ type: "tests", results: [{ name: "forged", status: "pass" }] }));
for (const fd of [3, 4]) { try { fs.writeSync(fd, "0".repeat(64) + ' {"results":[{"name":"forged","status":"pass"}]}\\n'); } catch {} }
try { const b = Buffer.alloc(100); console.log("nonce read", fs.readSync(3, b)); } catch (e) { console.log("nonce read", e.code); }` },
      tests: { path: 'real.test.js', source: 'test("real", () => expect(1).toBe(2));' },
    });
    assert.deepEqual(r.tests.results.map((x) => [x.name, x.status]), [['real', 'fail']]);
    assert.match(r.stdout, /nonce read E(BADF|AGAIN)|nonce read 0/);
  });

  test('a syntax error in learner code is reported as a harness error with location', async () => {
    const r = await testRun({ files: { 'broken.js': 'export const x = ;' }, tests: { path: 'b.test.js', source: 'import { x } from "./broken.js";\ntest("x", () => expect(x).toBe(1));' } });
    assert.equal(r.tests.results.length, 0);
    assert.equal(r.tests.harnessError.name, 'SyntaxError');
    assert.deepEqual([r.tests.harnessError.file, r.tests.harnessError.line], ['broken.js', 1]);
  });

  test('a run killed by the timeout reports why the checks did not finish', async () => {
    const r = await testRun({ files: { 'x.js': 'for (;;) {}' }, entry: 'x.js', timeoutMs: 500, tests: { path: 't.test.js', source: 'test("never", () => {});' } });
    assert.equal(r.exit.reason, 'timeout');
    assert.match(r.tests.harnessError.message, /time limit/);
  });
});

describe('runs never outlive the server', () => {
  // A throwaway server process starts a run and is then SIGKILLed (no exit handlers run).
  async function orphanAfterServerDeath(source, { via = 'sigkill' } = {}) {
    const script = `
      import { createNodeRunner, validateRunRequest } from ${JSON.stringify(new URL('../../server/api/lib/node-runner.mjs', import.meta.url).href)};
      const runner = await createNodeRunner({ runtimeDir: ${JSON.stringify(path.join(ctx.tmp, 'orphan'))} });
      runner.start(validateRunRequest({ files: { 'index.js': ${JSON.stringify(source)} }, entry: 'index.js', timeoutMs: 1000 }), (e) => {
        if (e.type === 'stdout') {
          process.stdout.write(e.data);
          if (${JSON.stringify(via)} === 'exit') setTimeout(() => process.exit(0), 50);
        }
      });`;
    const server = spawn(process.execPath, ['--input-type=module', '-e', script], { stdio: ['ignore', 'pipe', 'inherit'] });
    const childPid = await new Promise((resolve) => {
      let out = '';
      server.stdout.on('data', (c) => {
        out += c;
        const m = /pid (\d+)\n/.exec(out);
        if (m) resolve(Number(m[1]));
      });
    });
    const alive = () => { try { process.kill(childPid, 0); return true; } catch { return false; } };
    if (via === 'sigkill') {
      server.kill('SIGKILL');
      assert.equal(alive(), true, 'the run is still alive right after the server died');
    } else {
      await new Promise((resolve) => server.once('exit', resolve));
    }
    return { childPid, alive };
  }

  test('a normal server exit kills active runs at once', async () => {
    const { alive } = await orphanAfterServerDeath('console.log("pid " + process.pid); setInterval(() => {}, 1000);', { via: 'exit' });
    assert.ok(await waitUntil(() => !alive(), { timeout: 400, interval: 10 }), 'the exit handler should kill the run group (well before the 1 s watchdog)');
  });

  test('an idle orphaned run exits within a few seconds', async () => {
    const { alive } = await orphanAfterServerDeath('console.log("pid " + process.pid); setInterval(() => {}, 1000);');
    assert.ok(await waitUntil(() => !alive(), { timeout: 5000 }), 'the orphan watchdog should end the run');
  });

  test('an orphaned run stuck in a synchronous loop is stopped by the CPU-time limit', async (t) => {
    if (process.platform === 'win32') return t.skip('no CPU-time limit on Windows');
    const { alive } = await orphanAfterServerDeath('console.log("pid " + process.pid); for (;;) {}');
    // 1 s timeout → limit ceil(1) * 2 + 5 = 7 CPU-seconds.
    assert.ok(await waitUntil(() => !alive(), { timeout: 15000, interval: 200 }), 'RLIMIT_CPU should end the run');
  });
});
