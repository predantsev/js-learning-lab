// Test-mode entry of an isolated Node run (POST /api/node/run with mode "test").
// Runs inside the restricted child process: imports the learner entry with real Node ESM,
// then the check file, runs the registered tests and reports results on a private channel.
//
// Result channel: the server writes a per-run nonce to fd 3 and closes it; this file reads it
// before any learner code runs, closes fd 3, and writes "<nonce> <json>" to fd 4. Output printed
// by learner code (stdout/stderr) can therefore never be mistaken for results. Learner code runs
// in the same process, so a deliberate attempt to tamper with the harness is not prevented; the
// result is self-assessment, not a security decision.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AssertionError, expect, show, sleep, spy, waitFor } from './expect.mjs';

// Captured before learner code can replace them.
const { writeSync, readSync, closeSync, mkdirSync } = fs;
const stringify = JSON.stringify;
const parse = JSON.parse;
const now = () => performance.now();
const activeInfo = process.getActiveResourcesInfo.bind(process);
const nativeSetTimeout = setTimeout;
const nativeClearTimeout = clearTimeout;
const HARNESS_DIR = path.dirname(fileURLToPath(import.meta.url));

// ---------- private channel ----------
function readNonce() {
  const buffer = Buffer.alloc(128);
  const pause = new Int32Array(new SharedArrayBuffer(4));
  let text = '';
  for (let attempt = 0; attempt < 4000 && !text.includes('\n'); attempt++) {
    let n;
    try {
      n = readSync(3, buffer, 0, buffer.length, null);
    } catch (error) {
      if (error.code === 'EAGAIN') {
        Atomics.wait(pause, 0, 0, 5);
        continue;
      }
      throw error;
    }
    if (n === 0) break;
    text += buffer.toString('utf8', 0, n);
  }
  return text.trim();
}
const nonce = readNonce();
try {
  closeSync(3);
} catch {
  /* already closed */
}

function report(payload) {
  let text = stringify(payload);
  if (text.length > 1_000_000) text = stringify({ results: payload.results.slice(0, 200).map((r) => ({ name: r.name, status: r.status, message: r.message, ms: r.ms })), harnessError: payload.harnessError, errors: [], cut: true });
  const line = Buffer.from(`${nonce} ${text}\n`, 'utf8');
  let offset = 0;
  while (offset < line.length) {
    try {
      offset += writeSync(4, line, offset, line.length - offset);
    } catch (error) {
      if (error.code !== 'EAGAIN') throw error;
    }
  }
}

// ---------- configuration (argv[2]) — removed before learner code sees process.argv ----------
const config = parse(process.argv[2]);
const workspace = config.workspace;
const entryFile = config.entry ? path.join(workspace, config.entry) : null;
process.argv.splice(1, 2, entryFile ?? path.join(workspace, config.tests));

// ---------- output capture for logs() ----------
const captured = []; // { stream, text }
let capturedChars = 0;
for (const stream of ['stdout', 'stderr']) {
  const target = process[stream];
  const original = target.write;
  target.write = function write(chunk, encoding, callback) {
    if (capturedChars < 2_000_000) {
      const text = typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString(typeof encoding === 'string' ? encoding : 'utf8');
      captured.push({ stream, text });
      capturedChars += text.length;
    }
    return original.call(this, chunk, encoding, callback);
  };
}
function logs({ stream } = {}) {
  const text = captured.filter((c) => stream === undefined || c.stream === stream).map((c) => c.text).join('');
  if (text === '') return [];
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

// ---------- errors ----------
const harnessFrame = (line) => line.includes(HARNESS_DIR);
function cleanStack(stack) {
  return String(stack || '').split('\n').filter((line) => !harnessFrame(line)).join('\n');
}
function describeError(error) {
  if (error && typeof error === 'object' && 'message' in error) {
    const stack = cleanStack(error.stack);
    // First reference to a learner file: "at fn (file:///…/a.js:3:7)" frames, or the
    // "file:///…/a.js:1" header Node prints above a SyntaxError.
    let where = null;
    for (const m of stack.matchAll(/((?:file:\/\/)?\/[^\s()]+?\.[cm]?[jt]sx?):(\d+)(?::(\d+))?/g)) {
      const file = m[1].startsWith('file:') ? fileURLToPath(m[1]) : m[1];
      if (file.startsWith(workspace + path.sep)) {
        where = { file: path.relative(workspace, file).split(path.sep).join('/'), line: Number(m[2]), column: m[3] ? Number(m[3]) : undefined };
        break;
      }
    }
    return {
      name: String(error.name || 'Error'),
      message: String(error.message).slice(0, 4000),
      code: typeof error.code === 'string' ? error.code : undefined,
      stack: stack.slice(0, 8000),
      ...(where ?? {}),
    };
  }
  return { name: 'Error', message: show(error) };
}

// ---------- helpers exposed to checks ----------
const tests = [];
const listened = new Set();
const uncaught = [];
let current = null; // the running test record
let currentTimers = 0;
let baseline = [];

function countBy(list) {
  const counts = new Map();
  for (const item of list) counts.set(item, (counts.get(item) ?? 0) + 1);
  return counts;
}
/** Active handles/requests created by learner code: the harness's own resources are subtracted. */
function activeResources() {
  const counts = countBy(baseline);
  counts.set('Timeout', (counts.get('Timeout') ?? 0) + currentTimers);
  const out = [];
  for (const item of activeInfo()) {
    const left = counts.get(item) ?? 0;
    if (left > 0) counts.set(item, left - 1);
    else out.push(item);
  }
  return out;
}

async function listen(server, host = '127.0.0.1') {
  if (!server || typeof server.listen !== 'function' || typeof server.address !== 'function') throw new TypeError('listen(server) expects an http.Server or net.Server');
  if (!server.listening) {
    await new Promise((resolve, reject) => {
      const onError = (error) => reject(error);
      server.once('error', onError);
      server.listen(0, host, () => {
        server.off('error', onError);
        resolve();
      });
    });
  }
  listened.add(server);
  const address = server.address();
  const shownHost = address.family === 'IPv6' || address.family === 6 ? `[${address.address}]` : address.address;
  return `http://${shownHost}:${address.port}`;
}

/** HTTP request without connection pooling (so it never leaves sockets behind for leak checks). */
function request(url, init = {}) {
  return new Promise((resolve, reject) => {
    const headers = { ...(init.headers ?? {}) };
    let body = init.body;
    if (body !== undefined && body !== null && typeof body === 'object' && !Buffer.isBuffer(body) && !(body instanceof Uint8Array)) {
      body = stringify(body);
      if (!Object.keys(headers).some((h) => h.toLowerCase() === 'content-type')) headers['content-type'] = 'application/json';
    }
    const req = http.request(url, { method: init.method ?? 'GET', headers, agent: false }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('error', reject);
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json;
        try {
          json = parse(text);
        } catch {
          json = undefined;
        }
        resolve({ status: res.statusCode, statusText: res.statusMessage, headers: { ...res.headers }, text, json });
      });
    });
    req.on('error', reject);
    if (init.signal) init.signal.addEventListener('abort', () => req.destroy(init.signal.reason ?? new Error('aborted')), { once: true });
    req.end(body === undefined || body === null ? undefined : body);
  });
}

function tmp(name = '') {
  const rel = String(name);
  if (path.isAbsolute(rel) || rel.split(/[\\/]/).includes('..')) throw new TypeError(`tmp(name) expects a relative name inside the exercise folder, got ${show(name)}`);
  const full = path.join(workspace, '.tmp', rel);
  mkdirSync(rel === '' ? full : path.dirname(full), { recursive: true });
  return full;
}

let loadFailure = null;
// Node keeps the file:line + caret of an ESM SyntaxError out of error.stack and prints it only for
// uncaught errors; such an error is re-thrown after the results are reported so Node prints it.
let rethrowAtExit = null;
const noteSyntaxError = (error, described) => {
  if (rethrowAtExit === null && described.name === 'SyntaxError' && described.file === undefined) rethrowAtExit = error;
};
const api = {
  test: (name, fn, options = {}) => {
    if (typeof fn !== 'function') throw new TypeError(`test(${show(name)}) needs a function`);
    tests.push({ name: String(name), fn, timeoutMs: Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : config.testTimeoutMs });
  },
  expect,
  spy,
  sleep,
  waitFor,
  logs,
  listen,
  request,
  activeResources,
  tmp,
  loadError: () => loadFailure,
  AssertionError,
};
for (const [name, value] of Object.entries(api)) Object.defineProperty(globalThis, name, { value, writable: false, configurable: false, enumerable: false });

process.on('uncaughtException', (error) => {
  const d = describeError(error);
  process.stderr.write(`Uncaught ${d.stack || `${d.name}: ${d.message}`}\n`);
  if (current) current.uncaught = current.uncaught ?? d;
  else uncaught.push(d);
});
process.on('unhandledRejection', (reason) => {
  const d = describeError(reason);
  process.stderr.write(`Unhandled promise rejection: ${d.stack || `${d.name}: ${d.message}`}\n`);
  if (current) current.uncaught = current.uncaught ?? d;
  else uncaught.push(d);
});

const settle = async () => {
  await new Promise((r) => nativeSetTimeout(r, 0));
  await new Promise((r) => nativeSetTimeout(r, 4));
};

async function closeListened() {
  for (const server of listened) {
    await new Promise((resolve) => {
      if (!server.listening) return resolve();
      server.closeAllConnections?.();
      const timer = nativeSetTimeout(resolve, 500);
      server.close(() => {
        nativeClearTimeout(timer);
        resolve();
      });
    });
  }
}

async function main() {
  baseline = activeInfo();
  if (entryFile) {
    try {
      await import(pathToFileURL(entryFile).href);
    } catch (error) {
      loadFailure = describeError(error);
      noteSyntaxError(error, loadFailure);
      if (rethrowAtExit !== error) process.stderr.write(`${loadFailure.stack || `${loadFailure.name}: ${loadFailure.message}`}\n`);
    }
    await settle();
  }
  try {
    await import(pathToFileURL(path.join(workspace, config.tests)).href);
  } catch (error) {
    const described = describeError(error);
    noteSyntaxError(error, described);
    return { results: [], harnessError: described, loadError: loadFailure, errors: uncaught };
  }
  if (tests.length === 0) return { results: [], harnessError: { name: 'HarnessError', message: 'The check file did not register any tests (call test(name, fn)).' }, loadError: loadFailure, errors: uncaught };
  const results = [];
  for (const t of tests) {
    const started = now();
    current = { name: t.name };
    let outcome = { name: t.name, status: 'pass' };
    let timer;
    try {
      currentTimers = 1;
      await Promise.race([
        Promise.resolve().then(() => t.fn()),
        new Promise((_, reject) => {
          timer = nativeSetTimeout(() => reject(new AssertionError(`test timed out after ${t.timeoutMs} ms`, {})), t.timeoutMs);
        }),
      ]);
      if (current.uncaught) throw Object.assign(new Error(`uncaught error during the test: ${current.uncaught.name}: ${current.uncaught.message}`), { name: current.uncaught.name, stack: current.uncaught.stack });
    } catch (error) {
      const d = describeError(error);
      outcome = { name: t.name, status: 'fail', message: d.message, errorName: d.name, expected: error && error.expected, actual: error && error.actual, stack: d.name === 'AssertionError' ? undefined : d.stack };
    } finally {
      nativeClearTimeout(timer);
      currentTimers = 0;
    }
    outcome.ms = Math.round(now() - started);
    results.push(outcome);
    current = null;
  }
  await closeListened();
  return { results, loadError: loadFailure, errors: uncaught };
}

let payload;
try {
  payload = await main();
} catch (error) {
  payload = { results: [], harnessError: describeError(error), errors: uncaught };
}
report(payload);
const failed = payload.harnessError !== undefined || payload.results.some((r) => r.status !== 'pass');
// Let buffered output reach the server (pipes are asynchronous on macOS), then stop even if
// learner code left servers or timers running.
let pending = 2;
const done = () => {
  pending -= 1;
  if (pending > 0) return;
  if (rethrowAtExit !== null) {
    process.removeAllListeners('uncaughtException');
    nativeSetTimeout(() => {
      throw rethrowAtExit;
    }, 0);
    return;
  }
  process.exit(failed ? 1 : 0);
};
process.stdout.write('', done);
process.stderr.write('', done);
nativeSetTimeout(() => process.exit(failed ? 1 : 0), 1000).unref();
