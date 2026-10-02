// Isolated real-Node executor (DEC-12 "isolated-node" candidate). Each run is a fresh
// `process.execPath` child in a scratch workspace, launched with Node's permission model, a clean
// environment, the platform guard preload and — on macOS, when it works — a Seatbelt profile.
// The layers and what each one really enforces are documented in docs/platform/SERVER-API.md.
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import { existsSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import { fileURLToPath } from 'node:url';
import { HttpError } from '../../http-util.mjs';
import { pathProblem, randomId, validateFiles, writeFiles } from './project-files.mjs';

export const HARNESS_DIR = realpathSync(fileURLToPath(new URL('../../node-harness/', import.meta.url)));
const SANDBOX_EXEC = '/usr/bin/sandbox-exec';

export const LIMITS = Object.freeze({
  files: 200,
  totalBytes: 2 * 1024 * 1024,
  timeoutMs: { default: 10_000, min: 100, max: 60_000 },
  testTimeoutMs: { default: 4_000, max: 30_000 },
  outputBytes: 200 * 1024,
  concurrent: 2,
  heapMb: 256,
  workspaceBytes: 64 * 1024 * 1024,
  workspaceEntries: 5_000,
  stdinBytes: 1024 * 1024,
  args: 64,
  argBytes: 4096,
  // Localized example strings for checks (`L` in the harness). They travel in the harness
  // configuration argument, so they stay far below Linux's 128 KiB limit for one argument.
  stringKeys: 500,
  stringsBytes: 32 * 1024,
});
const STRING_KEY = /^[a-zA-Z][a-zA-Z0-9_]*$/;

const TS_FILE = /\.(ts|mts|cts)$/;
const live = new Set(); // child processes of every runner in this server process

let exitHookInstalled = false;
function killGroup(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  try {
    if (process.platform !== 'win32') process.kill(-child.pid, 'SIGKILL');
    else child.kill('SIGKILL');
  } catch {
    try {
      child.kill('SIGKILL');
    } catch {
      /* already gone */
    }
  }
}

/** Which permission-model flags this Node offers. Never assume a flag exists. */
export function detectNodeSupport(flags = process.allowedNodeEnvironmentFlags, features = process.features) {
  const has = (flag) => flags.has(flag);
  const permissionFlag = has('--permission') ? '--permission' : has('--experimental-permission') ? '--experimental-permission' : null;
  let typescript = false;
  if (features.typescript) typescript = 'native';
  else if (has('--experimental-strip-types')) typescript = 'flag';
  return {
    permissionFlag,
    fsFlags: has('--allow-fs-read') && has('--allow-fs-write'),
    allowNet: has('--allow-net'),
    allowWorker: has('--allow-worker'),
    disableWarning: has('--disable-warning'),
    heapFlag: has('--max-old-space-size'),
    typescript,
  };
}

const sbString = (value) => `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** macOS Seatbelt profile: writes only in the workspace, no reads of personal folders, no new processes, signals only to itself, network per capability. */
export function seatbeltProfile({ workspace, readable, nodeBinary, network }) {
  const lines = [
    '(version 1)',
    '(allow default)',
    '(deny file-write*)',
    `(allow file-write* (subpath ${sbString(workspace)}) (literal "/dev/null") (literal "/dev/dtracehelper") (regex #"^/dev/tty"))`,
    '(deny file-read-data (subpath "/Users") (subpath "/Volumes") (subpath "/private/var/folders") (subpath "/private/tmp") (subpath "/private/var/tmp"))',
    `(allow file-read-data ${[workspace, ...readable].map((p) => `(subpath ${sbString(p)})`).join(' ')})`,
    '(deny process-fork)',
    '(deny process-exec)',
    `(allow process-exec (literal ${sbString(nodeBinary)}))`,
    '(deny signal)',
    '(allow signal (target self))',
    '(deny network*)',
  ];
  if (network === 'loopback') {
    lines.push('(allow network-bind (local ip "localhost:*"))', '(allow network-inbound (local ip "localhost:*"))', '(allow network-outbound (remote ip "localhost:*"))');
  }
  return lines.join('\n');
}

function enforcement(support, osActive) {
  const os = osActive ? ['os-sandbox'] : [];
  return {
    fsRead: ['node-permission'],
    fsWrite: ['node-permission'],
    childProcesses: ['node-permission', ...os],
    nativeAddons: ['node-permission'],
    wasi: ['node-permission'],
    inspector: ['node-permission'],
    workersWhenDenied: ['node-permission'],
    workerExecArgv: ['platform-guard', ...os],
    networkNone: [...(support.allowNet ? ['node-permission'] : []), ...os, 'platform-guard'],
    networkLoopbackOutbound: [...os, 'platform-guard'],
    networkLoopbackListen: ['platform-guard'],
    sqliteFiles: [...os, 'platform-guard'],
    signalsToOtherProcesses: [...os, 'platform-guard'],
  };
}

function limitations(support, osActive) {
  const out = [
    'Node documents its permission model as a "seat belt" for trusted code, not a sandbox against malicious code.',
    'node:sqlite does not consult the permission model on any tested Node version (it can read and write database files anywhere); database paths are limited by the platform guard' + (osActive ? ' and the macOS Seatbelt profile (writes: workspace only; reads: personal and temporary folders closed).' : ' only (bypassable by deliberate code).'),
    'A worker started with its own execArgv runs without the permission model; the platform guard rejects that option' + (osActive ? ' and Seatbelt still applies to the whole process.' : ' (bypassable by deliberate code).'),
    'Loopback-only servers are enforced by the platform guard only: Seatbelt cannot restrict which address a server binds to.',
    'Memory: the JavaScript heap is capped; memory outside the heap (Buffers, ArrayBuffers) is not.',
    'Disk use in the workspace is checked every 250 ms, so a burst can briefly exceed the limit before the run is stopped.',
  ];
  if (!support.allowNet) out.push('This Node version has no network permission (--allow-net exists from Node 25): network "none" is enforced by the platform guard' + (osActive ? ' and Seatbelt.' : ' only.'));
  else out.push('--allow-net is all-or-nothing: in "loopback" mode Node itself allows every address; the loopback restriction comes from the platform guard' + (osActive ? ' and Seatbelt (outbound).' : '.'));
  if (support.typescript === false) out.push('This Node version cannot run TypeScript files (no type stripping).');
  if (!osActive) out.push('No operating-system sandbox layer is active on this machine.');
  return out;
}

async function dirSize(root, limits) {
  let bytes = 0;
  let entries = 0;
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    let list;
    try {
      list = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of list) {
      entries += 1;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else {
        try {
          bytes += (await fs.lstat(full)).size;
        } catch {
          /* removed meanwhile */
        }
      }
      if (bytes > limits.workspaceBytes || entries > limits.workspaceEntries) return { bytes, entries, exceeded: true };
    }
  }
  return { bytes, entries, exceeded: false };
}

function intIn(value, { min, max, fallback, name }) {
  if (value === undefined || value === null) return fallback;
  if (!Number.isInteger(value) || value < min || value > max) throw new HttpError(400, 'bad-request', `"${name}" must be an integer between ${min} and ${max}.`);
  return value;
}

/** Validate a run request body. Returns a normalized spec or throws HttpError 400/413. */
export function validateRunRequest(body, limits = LIMITS) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'bad-body', 'Send a JSON object.');
  const mode = body.mode ?? 'run';
  if (mode !== 'run' && mode !== 'test') throw new HttpError(400, 'bad-request', '"mode" must be "run" or "test".');
  const files = validateFiles(body.files ?? {}, { maxFiles: limits.files, maxBytes: limits.totalBytes });
  const byPath = new Map(files.map((f) => [f.path, f]));
  let entry = body.entry ?? null;
  if (entry !== null) {
    if (typeof entry !== 'string' || pathProblem(entry)) throw new HttpError(400, 'bad-path', `Unsafe entry path ${JSON.stringify(entry)}.`);
    if (!byPath.has(entry)) throw new HttpError(400, 'bad-entry', `The entry file ${JSON.stringify(entry)} is not among the files.`);
  }
  if (mode === 'run' && entry === null) throw new HttpError(400, 'bad-entry', '"entry" is required in run mode.');
  let tests = null;
  if (mode === 'test') {
    const t = body.tests;
    if (!t || typeof t.path !== 'string' || typeof t.source !== 'string') throw new HttpError(400, 'bad-tests', 'Test mode needs "tests": { path, source }.');
    const problem = pathProblem(t.path);
    if (problem) throw new HttpError(400, 'bad-path', `Unsafe test path ${JSON.stringify(t.path)}: ${problem}.`);
    if ([...byPath.keys()].some((p) => p.toLowerCase() === t.path.toLowerCase())) throw new HttpError(400, 'bad-tests', `The test path ${JSON.stringify(t.path)} collides with a learner file.`);
    const total = files.reduce((n, f) => n + f.bytes, 0) + Buffer.byteLength(t.source);
    if (total > limits.totalBytes) throw new HttpError(413, 'too-large', `Files and tests total ${total} bytes; the limit is ${limits.totalBytes}.`);
    tests = { path: t.path, source: t.source, timeoutMs: intIn(t.timeoutMs, { min: 50, max: limits.testTimeoutMs.max, fallback: limits.testTimeoutMs.default, name: 'tests.timeoutMs' }) };
  }
  const stdin = body.stdin ?? '';
  if (typeof stdin !== 'string' || Buffer.byteLength(stdin) > limits.stdinBytes) throw new HttpError(400, 'bad-request', `"stdin" must be a string of at most ${limits.stdinBytes} bytes.`);
  const args = body.args ?? [];
  if (!Array.isArray(args) || args.length > limits.args || args.some((a) => typeof a !== 'string' || a.includes('\0') || Buffer.byteLength(a) > limits.argBytes)) {
    throw new HttpError(400, 'bad-request', `"args" must be at most ${limits.args} strings of up to ${limits.argBytes} bytes.`);
  }
  const timeoutMs = intIn(body.timeoutMs, { ...limits.timeoutMs, fallback: limits.timeoutMs.default, name: 'timeoutMs' });
  const caps = body.capabilities ?? {};
  if (caps === null || typeof caps !== 'object') throw new HttpError(400, 'bad-request', '"capabilities" must be an object.');
  const network = caps.network ?? 'none';
  if (network !== 'none' && network !== 'loopback') throw new HttpError(400, 'bad-request', '"capabilities.network" must be "none" or "loopback".');
  const workers = caps.workers ?? false;
  if (typeof workers !== 'boolean') throw new HttpError(400, 'bad-request', '"capabilities.workers" must be a boolean.');
  return { mode, files, entry, tests, stdin, args, timeoutMs, network, workers, strings: validateStrings(body.strings, limits) };
}

/** Localized example strings (`{ key: text }`) that test mode exposes to checks as `L`. */
function validateStrings(value, limits) {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'bad-request', '"strings" must be an object of { key: text }.');
  const entries = Object.entries(value);
  if (entries.length > limits.stringKeys) throw new HttpError(400, 'bad-request', `"strings" may have at most ${limits.stringKeys} keys.`);
  let bytes = 0;
  for (const [key, text] of entries) {
    if (!STRING_KEY.test(key) || typeof text !== 'string') throw new HttpError(400, 'bad-request', `"strings" keys use letters, digits and underscores (starting with a letter) and values are text: ${JSON.stringify(key)}.`);
    bytes += Buffer.byteLength(key) + Buffer.byteLength(text);
  }
  if (bytes > limits.stringsBytes) throw new HttpError(413, 'too-large', `"strings" total ${bytes} bytes; the limit is ${limits.stringsBytes}.`);
  return Object.fromEntries(entries);
}

/**
 * `disabled` (a reason) turns execution off without probing: the feature reports unavailable with
 * that reason and every run answers 501. Turning execution off never weakens isolation.
 */
export async function createNodeRunner({ runtimeDir, osSandbox = 'auto', limits = LIMITS, support = detectNodeSupport(), nodeBinary = realpathSync(process.execPath), disabled = null } = {}) {
  const runsDir = path.join(runtimeDir, 'node-runs');
  await fs.mkdir(runsDir, { recursive: true });
  const runsRoot = realpathSync(runsDir);
  const runs = new Map();
  const nodeRoot = path.dirname(path.dirname(nodeBinary)); // <prefix>/bin/node → <prefix>
  let osActive = false;

  if (!exitHookInstalled) {
    exitHookInstalled = true;
    process.once('exit', () => {
      for (const child of live) killGroup(child);
    });
  }

  function buildCommand({ workspace, spec, profile, guard = true, script = null }) {
    const flags = [support.permissionFlag, `--allow-fs-read=${workspace}`, `--allow-fs-read=${HARNESS_DIR}`, `--allow-fs-write=${workspace}`];
    if (spec.network === 'loopback' && support.allowNet) flags.push('--allow-net');
    if (spec.workers) flags.push('--allow-worker');
    if (support.disableWarning) {
      flags.push('--disable-warning=ExperimentalWarning');
      if (spec.workers) flags.push('--disable-warning=SecurityWarning');
    }
    if (support.heapFlag) flags.push(`--max-old-space-size=${limits.heapMb}`);
    const usesTs = [spec.entry, spec.tests?.path, ...spec.files.map((f) => f.path)].some((p) => p && TS_FILE.test(p));
    if (usesTs && support.typescript === 'flag') flags.push('--experimental-strip-types');
    if (guard) flags.push('--require', path.join(HARNESS_DIR, spec.network === 'loopback' ? 'guard-net-loopback.cjs' : 'guard-net-none.cjs'));
    let main;
    if (script !== null) main = [script];
    else if (spec.mode === 'test') {
      main = [path.join(HARNESS_DIR, 'test-main.mjs'), JSON.stringify({ workspace, entry: spec.entry, tests: spec.tests.path, testTimeoutMs: spec.tests.timeoutMs, strings: spec.strings ?? {} }), ...spec.args];
    } else main = [path.join(workspace, ...spec.entry.split('/')), ...spec.args];
    const nodeArgs = [...flags, ...main];
    if (profile) return { command: SANDBOX_EXEC, args: ['-p', profile, nodeBinary, ...nodeArgs], flags };
    return { command: nodeBinary, args: nodeArgs, flags };
  }

  function childEnv(workspace) {
    const tmp = path.join(workspace, '.tmp');
    const env = { NO_COLOR: '1', TMPDIR: tmp };
    if (process.platform === 'win32') {
      Object.assign(env, { TEMP: tmp, TMP: tmp });
      for (const key of ['SystemRoot', 'SYSTEMROOT', 'windir']) if (process.env[key]) env[key] = process.env[key];
    }
    return env;
  }

  /** Spawn a short probe and return its stdout parsed as JSON (null on failure). */
  async function probe(spec, source, { profile = null, guard = true } = {}) {
    const workspace = path.join(runsRoot, randomId('selftest'));
    await fs.mkdir(path.join(workspace, '.tmp'), { recursive: true });
    try {
      await fs.writeFile(path.join(workspace, 'probe.mjs'), source);
      const { command, args } = buildCommand({ workspace, spec: { ...spec, files: [] }, profile: profile ? profile(workspace) : null, guard, script: path.join(workspace, 'probe.mjs') });
      return await new Promise((resolve) => {
        const child = spawn(command, args, { cwd: workspace, env: childEnv(workspace), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
        let out = '';
        let err = '';
        child.stdout.on('data', (c) => { out += c; });
        child.stderr.on('data', (c) => { err += c; });
        const timer = setTimeout(() => child.kill('SIGKILL'), 10_000);
        child.on('error', (error) => { clearTimeout(timer); resolve({ ok: false, error: error.message }); });
        child.on('close', (code) => {
          clearTimeout(timer);
          try {
            resolve({ ok: code === 0, code, result: JSON.parse(out.trim().split('\n').pop()), stderr: err.slice(0, 2000) });
          } catch {
            resolve({ ok: false, code, stderr: err.slice(0, 2000) });
          }
        });
      });
    } finally {
      await fs.rm(workspace, { recursive: true, force: true });
    }
  }

  const outsideFile = path.join(HARNESS_DIR, '..', 'config.mjs');
  const permissionProbe = `
    import fs from 'node:fs';
    const r = {};
    try { fs.writeFileSync('inside.txt', 'ok'); r.writeInside = fs.readFileSync('inside.txt', 'utf8') === 'ok'; } catch (e) { r.writeInside = e.code; }
    try { fs.readFileSync(${JSON.stringify(outsideFile)}); r.readOutside = 'allowed'; } catch (e) { r.readOutside = e.code; }
    try { (await import('node:child_process')).execFileSync('true'); r.childProcess = 'allowed'; } catch (e) { r.childProcess = e.code; }
    console.log(JSON.stringify(r));`;
  const seatbeltProbe = `
    import path from 'node:path';
    const r = {};
    try { const { DatabaseSync } = await import('node:sqlite'); new DatabaseSync(path.join(process.cwd(), '..', 'seatbelt-probe.db')).exec('create table t(x)'); r.sqliteOutside = 'allowed'; } catch (e) { r.sqliteOutside = e.code ?? 'denied'; }
    try { process.kill(process.ppid, 0); r.signalParent = 'allowed'; } catch (e) { r.signalParent = e.code; }
    console.log(JSON.stringify(r));`;

  // ---- availability: prove isolation on this machine instead of trusting flag names ----
  const feature = { available: false, node: process.version, flags: [], typescript: support.typescript, osSandbox: { kind: null, active: false }, limits: { ...limits } };
  if (disabled) {
    feature.reason = String(disabled);
  } else if (!support.permissionFlag || !support.fsFlags) {
    feature.reason = `Node ${process.version} has no permission model (--permission / --allow-fs-read). Code is never run without isolation.`;
  } else {
    const baseSpec = { mode: 'run', entry: null, tests: null, args: [], network: 'none', workers: false, files: [] };
    const checked = await probe(baseSpec, permissionProbe);
    const r = checked.result ?? {};
    if (checked.ok && r.writeInside === true && r.readOutside === 'ERR_ACCESS_DENIED' && r.childProcess === 'ERR_ACCESS_DENIED') {
      feature.available = true;
      feature.flags = [support.permissionFlag, '--allow-fs-read', '--allow-fs-write', '--require', ...(support.allowNet ? ['--allow-net'] : []), ...(support.allowWorker ? ['--allow-worker'] : []), ...(support.disableWarning ? ['--disable-warning'] : []), ...(support.heapFlag ? ['--max-old-space-size'] : []), ...(support.typescript === 'flag' ? ['--experimental-strip-types'] : [])];
    } else {
      feature.reason = `The permission-model self-test did not confirm isolation (${JSON.stringify(r)}${checked.stderr ? `; ${checked.stderr.trim().split('\n').slice(-1)[0]}` : ''}). Code is never run without isolation.`;
    }
  }
  if (feature.available && osSandbox !== false && process.platform === 'darwin' && existsSync(SANDBOX_EXEC)) {
    feature.osSandbox.kind = 'macos-seatbelt';
    const profile = (workspace) => seatbeltProfile({ workspace, readable: [HARNESS_DIR, nodeRoot], nodeBinary, network: 'none' });
    const checked = await probe({ mode: 'run', entry: null, tests: null, args: [], network: 'none', workers: false, files: [] }, seatbeltProbe, { profile, guard: false });
    const r = checked.result ?? {};
    await fs.rm(path.join(runsRoot, 'seatbelt-probe.db'), { force: true });
    if (checked.ok && r.sqliteOutside !== 'allowed' && r.signalParent !== 'allowed') osActive = true;
    else feature.osSandbox.reason = `sandbox-exec self-test failed (${JSON.stringify(r)}${checked.error ? `; ${checked.error}` : ''}${checked.stderr ? `; ${checked.stderr.trim().split('\n').slice(-1)[0]}` : ''}).`;
  } else if (process.platform !== 'darwin') {
    feature.osSandbox.reason = `No operating-system sandbox layer is implemented for ${process.platform}.`;
  } else if (osSandbox === false) {
    feature.osSandbox.reason = 'Disabled by configuration.';
  }
  feature.osSandbox.active = osActive;
  feature.enforcement = enforcement(support, osActive);
  feature.limitations = limitations(support, osActive);

  function policyFor(spec) {
    return {
      network: spec.network,
      workers: spec.workers,
      osSandbox: osActive ? 'macos-seatbelt' : null,
      networkEnforcedBy: spec.network === 'none' ? feature.enforcement.networkNone : feature.enforcement.networkLoopbackOutbound,
      typescript: support.typescript,
    };
  }

  /**
   * Start a validated run. `emit(event)` receives NDJSON events in order; the returned promise
   * settles after the final "exit" event and workspace removal.
   */
  async function start(spec, emit) {
    if (!feature.available) throw new HttpError(501, 'isolation-unavailable', feature.reason);
    if (runs.size >= limits.concurrent) throw new HttpError(429, 'busy', `At most ${limits.concurrent} Node runs can be active at once. Stop one or wait for it to finish.`);
    const runId = randomId('nr');
    const run = { runId, kill: () => {}, finished: false };
    runs.set(runId, run);
    const workspace = path.join(runsRoot, runId);
    const startedAt = performance.now();
    try {
      await fs.mkdir(path.join(workspace, '.tmp'), { recursive: true });
      const entries = [...spec.files];
      if (!entries.some((f) => f.path === 'package.json')) entries.push({ path: 'package.json', text: '{ "type": "module" }\n' });
      if (spec.tests) entries.push({ path: spec.tests.path, text: spec.tests.source });
      await writeFiles(workspace, entries);
    } catch (error) {
      runs.delete(runId);
      await fs.rm(workspace, { recursive: true, force: true });
      throw error;
    }

    const profile = osActive ? seatbeltProfile({ workspace, readable: [HARNESS_DIR, nodeRoot], nodeBinary, network: spec.network }) : null;
    let { command, args } = buildCommand({ workspace, spec, profile });
    if (process.platform !== 'win32' && existsSync('/bin/sh') && existsSync('/usr/bin/env')) {
      // CPU-time ceiling enforced by the kernel. The wall-clock timeout above normally fires first;
      // this one still stops a run stuck in a synchronous loop if the server itself died (Ctrl+C
      // does not run exit handlers and the run lives in its own process group). V8 helper threads
      // and workers add CPU time, hence the margin.
      const cpuSeconds = Math.ceil(spec.timeoutMs / 1000) * (spec.workers ? 8 : 2) + 5;
      // `env -u` drops the variables the shell itself adds (PWD, SHLVL…), keeping the child env clean.
      args = ['-c', 'ulimit -t "$1" && shift && exec /usr/bin/env -u SHLVL -u PWD -u OLDPWD -u _ "$@"', 'jsll-run', String(cpuSeconds), command, ...args];
      command = '/bin/sh';
    }
    const testMode = spec.mode === 'test';
    const nonce = randomBytes(32).toString('hex');
    const state = { reason: null, timedOut: false, truncated: false, outputBytes: 0, results: null, resultsBuf: '', stderrTail: '' };

    emit({ type: 'start', runId, node: process.version, mode: spec.mode, cwd: workspace, policy: policyFor(spec) });

    return new Promise((resolve) => {
      let child = null;
      let timer = null;
      let watchdog = null;
      let finished = false;
      const decoders = { stdout: new StringDecoder('utf8'), stderr: new StringDecoder('utf8') };
      const kill = (reason) => {
        if (state.reason === null) state.reason = reason;
        if (child) killGroup(child);
      };
      run.kill = kill;

      const finish = async ({ code, signal, spawnError }) => {
        if (finished) return;
        finished = true;
        run.finished = true;
        clearTimeout(timer);
        clearInterval(watchdog);
        if (child) live.delete(child);
        for (const stream of ['stdout', 'stderr']) {
          const rest = decoders[stream].end();
          if (rest) emit({ type: stream, data: rest });
        }
        // A signal the platform did not send (SIGABRT on heap exhaustion, SIGSEGV…) is a crash.
        const reason = spawnError ? 'spawn-failed' : state.reason ?? (signal ? 'crashed' : 'exited');
        if (testMode) emit(testsEvent(reason, code, signal, spawnError));
        emit({
          type: 'exit',
          code,
          signal,
          timedOut: state.timedOut,
          truncated: state.truncated,
          durationMs: Math.round(performance.now() - startedAt),
          reason,
          stopped: reason === 'stopped',
          ...(spawnError ? { error: spawnError } : {}),
        });
        runs.delete(runId);
        await fs.rm(workspace, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
        resolve();
      };

      // Node prints an ESM SyntaxError's "file:///…:line" header only to stderr: attach it.
      const locate = (error) => {
        if (!error || error.file !== undefined || error.name !== 'SyntaxError') return error;
        for (const m of state.stderrTail.matchAll(/^file:\/\/(\/[^\n]+?):(\d+)$/gm)) {
          const file = decodeURIComponent(m[1]);
          if (file.startsWith(workspace + path.sep)) return { ...error, file: path.relative(workspace, file).split(path.sep).join('/'), line: Number(m[2]) };
        }
        return error;
      };
      const testsEvent = (reason, code, signal, spawnError) => {
        if (state.results) {
          const { results, errors } = state.results;
          const harnessError = locate(state.results.harnessError);
          const loadError = locate(state.results.loadError);
          return { type: 'tests', results, ...(harnessError ? { harnessError } : {}), ...(loadError ? { loadError } : {}), ...(errors?.length ? { errors } : {}) };
        }
        const why = {
          timeout: `the run reached its ${spec.timeoutMs} ms time limit`,
          'output-limit': `the output exceeded ${limits.outputBytes} bytes`,
          'workspace-limit': 'the files written exceeded the workspace limit',
          stopped: 'the run was stopped',
          disconnected: 'the client disconnected',
          'spawn-failed': `Node could not be started (${spawnError})`,
        }[reason] ?? `the process exited with ${signal ? `signal ${signal}` : `code ${code}`} before reporting`;
        return { type: 'tests', results: [], harnessError: { name: 'HarnessError', message: `The checks did not finish: ${why}.` } };
      };

      try {
        child = spawn(command, args, {
          cwd: workspace,
          env: childEnv(workspace),
          stdio: testMode ? ['pipe', 'pipe', 'pipe', 'pipe', 'pipe'] : ['pipe', 'pipe', 'pipe'],
          detached: process.platform !== 'win32',
          windowsHide: true,
        });
      } catch (error) {
        finish({ code: null, signal: null, spawnError: error.message });
        return;
      }
      live.add(child);

      const onOutput = (stream) => (chunk) => {
        if (state.truncated) return;
        const room = limits.outputBytes - state.outputBytes;
        if (chunk.length >= room) {
          const text = decoders[stream].write(chunk.subarray(0, Math.max(room, 0)));
          state.outputBytes = limits.outputBytes;
          if (text) emit({ type: stream, data: text });
          state.truncated = true;
          kill('output-limit');
          return;
        }
        state.outputBytes += chunk.length;
        const text = decoders[stream].write(chunk);
        if (stream === 'stderr' && testMode) state.stderrTail = (state.stderrTail + text).slice(-65536);
        if (text) emit({ type: stream, data: text });
      };
      child.stdout.on('data', onOutput('stdout'));
      child.stderr.on('data', onOutput('stderr'));
      child.stdin.on('error', () => {}); // the program may exit without reading stdin
      child.stdin.end(spec.stdin);

      if (testMode) {
        child.stdio[3].on('error', () => {});
        child.stdio[3].end(`${nonce}\n`);
        child.stdio[4].on('error', () => {});
        child.stdio[4].on('data', (chunk) => {
          if (state.results !== null || state.resultsBuf.length > 4 * 1024 * 1024) return;
          state.resultsBuf += chunk.toString('utf8');
          let i;
          while (state.results === null && (i = state.resultsBuf.indexOf('\n')) >= 0) {
            const line = state.resultsBuf.slice(0, i);
            state.resultsBuf = state.resultsBuf.slice(i + 1);
            if (!line.startsWith(`${nonce} `)) continue; // anything else on fd 4 was not written by the harness
            try {
              const message = JSON.parse(line.slice(nonce.length + 1));
              if (message && Array.isArray(message.results)) state.results = message;
            } catch {
              /* ignore malformed */
            }
          }
        });
      }

      timer = setTimeout(() => {
        state.timedOut = true;
        kill('timeout');
      }, spec.timeoutMs);
      let checking = false;
      watchdog = setInterval(async () => {
        if (checking || finished) return;
        checking = true;
        const size = await dirSize(workspace, limits);
        checking = false;
        if (size.exceeded) kill('workspace-limit');
      }, 250);

      child.on('error', (error) => finish({ code: null, signal: null, spawnError: error.message }));
      child.on('close', (code, signal) => finish({ code, signal }));
    });
  }

  function stop(runId, reason = 'stopped') {
    const run = runs.get(runId);
    if (!run || run.finished) return false;
    run.kill(reason);
    return true;
  }

  return { feature, start, stop, runs, support, buildCommand, get osActive() { return osActive; } };
}
