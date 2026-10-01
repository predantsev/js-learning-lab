// Build-time execution in node:vm (Node only; never imported by the browser bundle).
// Provides a deterministic environment for the content compiler: captured console, virtual
// timers (setTimeout/setInterval/queueMicrotask/requestAnimationFrame fire in virtual time, in
// (time, sequence) order, with host microtasks drained between callbacks), a wall-clock timeout
// for synchronous code and the same loop budget hook as the sandbox (`__jsllLoopExceeded`).
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { transformScript } from '../transform.js';
import { traceBabelPlugin } from './tracer.js';

const TRACE_RUNTIME_URL = new URL('../../sandbox/trace-runtime.js', import.meta.url);
let traceRuntimeSource = null;
async function loadTraceRuntime() {
  if (traceRuntimeSource === null) traceRuntimeSource = await fs.readFile(TRACE_RUNTIME_URL, 'utf8');
  return traceRuntimeSource;
}

const macrotick = () => new Promise((resolve) => setImmediate(resolve));

/** Create an isolated context with console capture and virtual timers. */
export async function createRunContext({ maxTimerCallbacks = 200, maxOutput = 1000 } = {}) {
  const output = []; // { level, text }
  const timers = new Map(); // id → { id, at, seq, fn, args, every }
  const state = { now: 0, seq: 0, nextId: 1, fired: 0, overflow: false };
  const sandbox = {};
  const text = (args) => (sandbox.__jsllTrace ? sandbox.__jsllTrace.format(args) : args.map(String).join(' '));
  const push = (level, args) => {
    if (output.length >= maxOutput) { state.overflow = true; return; }
    output.push({ level, text: text(args) });
  };
  const console_ = {
    log: (...a) => push('log', a),
    info: (...a) => push('info', a),
    warn: (...a) => push('warn', a),
    error: (...a) => push('error', a),
    debug: (...a) => push('log', a),
    table: (...a) => push('log', a),
    dir: (...a) => push('log', a),
    assert: (cond, ...a) => { if (!cond) push('error', ['Assertion failed:', ...a]); },
    clear: () => {},
    group: (...a) => { if (a.length) push('log', a); },
    groupEnd: () => {},
    time: () => {},
    timeEnd: () => {},
    count: () => {},
    trace: (...a) => push('log', a),
  };
  const schedule = (fn, delay, args, every) => {
    const id = state.nextId++;
    const ms = Number.isFinite(Number(delay)) ? Math.max(0, Number(delay)) : 0;
    timers.set(id, { id, at: state.now + ms, seq: state.seq++, fn, args, every: every ? Math.max(1, ms) : null });
    return id;
  };
  Object.assign(sandbox, {
    console: console_,
    setTimeout: (fn, delay, ...args) => schedule(fn, delay, args, false),
    setInterval: (fn, delay, ...args) => schedule(fn, delay, args, true),
    clearTimeout: (id) => { timers.delete(id); },
    clearInterval: (id) => { timers.delete(id); },
    queueMicrotask: (fn) => queueMicrotask(fn),
    requestAnimationFrame: (fn) => schedule(() => fn(state.now), 16, [], false),
    cancelAnimationFrame: (id) => { timers.delete(id); },
    structuredClone: (v) => structuredClone(v),
    __jsllLoopExceeded: (line, budgetMs) => {
      const error = new Error(`Loop on line ${line} ran longer than ${budgetMs} ms (possible infinite loop).`);
      error.name = 'LoopBudgetError';
      throw error;
    },
  });
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  const context = vm.createContext(sandbox, { codeGeneration: { strings: true, wasm: false } });
  new vm.Script(await loadTraceRuntime(), { filename: 'trace-runtime.js' }).runInContext(context);

  /** Fire virtual timers (and drain microtasks) until none are left or the callback cap is hit. */
  async function drain() {
    await macrotick();
    while (timers.size > 0) {
      if (state.fired >= maxTimerCallbacks) { state.overflow = true; break; }
      let next = null;
      for (const timer of timers.values()) if (next === null || timer.at < next.at || (timer.at === next.at && timer.seq < next.seq)) next = timer;
      state.now = next.at;
      if (next.every !== null) { next.at = state.now + next.every; next.seq = state.seq++; } else timers.delete(next.id);
      state.fired += 1;
      try {
        if (typeof next.fn === 'function') next.fn(...next.args);
      } catch (error) {
        return error;
      }
      await macrotick();
    }
    return null;
  }

  /** Evaluate an expression in the context (wall-clock timeout for synchronous code). */
  const evalIn = (source, filename = 'expression.js', timeoutMs = 1000) => new vm.Script(source, { filename }).runInContext(context, { timeout: timeoutMs });

  return { context, sandbox, output, state, drain, evalIn };
}

/** Catch unhandled rejections raised by code inside the context while `fn` runs. */
async function withRejectionCapture(fn) {
  const rejections = [];
  const handler = (reason) => { rejections.push(reason); };
  process.on('unhandledRejection', handler);
  try {
    return { result: await fn(), rejections };
  } finally {
    process.off('unhandledRejection', handler);
  }
}

const describe = (error) => (error && typeof error === 'object' && 'message' in error ? { name: String(error.name || 'Error'), message: String(error.message), line: error.jsllLine ?? null } : { name: 'Thrown value', message: String(error), line: null });

/**
 * Run plain (untraced) source: used to verify event-loop claims and to execute pipeline stages.
 * @returns {{ output: {level,text}[], error: object|null, timersFired: number, overflow: boolean }}
 */
export async function runScript(source, { file = 'program.js', timeoutMs = 3000, loopBudgetMs = 2000, maxTimerCallbacks = 200, globals = {} } = {}) {
  const transformed = transformScript(file, source, { classic: true, loopBudgetMs, jsxInJs: false });
  if (transformed.error) return { output: [], error: { ...transformed.error, phase: 'compile' }, timersFired: 0, overflow: false };
  const run = await createRunContext({ maxTimerCallbacks });
  Object.assign(run.sandbox, globals);
  let error = null;
  const { result, rejections } = await withRejectionCapture(async () => {
    try {
      new vm.Script(`'use strict';\n${transformed.code}`, { filename: file }).runInContext(run.context, { timeout: timeoutMs });
    } catch (e) {
      return describe(e);
    }
    const async_ = await run.drain();
    return async_ ? describe(async_) : null;
  });
  error = result;
  if (!error && rejections.length > 0) error = { ...describe(rejections[0]), phase: 'unhandled-rejection' };
  return { output: run.output, error, timersFired: run.state.fired, overflow: run.state.overflow };
}

/**
 * Transform with the trace plugin, run, and return the collected trace.
 * @returns {{ trace: object|null, output: {level,text}[], error: object|null }}
 */
export async function runTraced(source, { file = 'program.js', maxSteps = 400, timeoutMs = 3000, loopBudgetMs = 2000, maxTimerCallbacks = 200, module = false } = {}) {
  const transformed = transformScript(file, source, { classic: !module, loopBudgetMs, jsxInJs: false, extraPlugins: [[traceBabelPlugin, { file }]] });
  if (transformed.error) return { trace: null, output: [], error: { ...transformed.error, phase: 'compile' }, code: null };
  const run = await createRunContext({ maxTimerCallbacks });
  run.sandbox.__jsllTrace.configure({ maxSteps });
  const { result, rejections } = await withRejectionCapture(async () => {
    try {
      new vm.Script(`'use strict';\n${transformed.code}`, { filename: file }).runInContext(run.context, { timeout: timeoutMs });
    } catch (e) {
      run.sandbox.__jsllTrace.uncaught(e);
      return describe(e);
    }
    const async_ = await run.drain();
    if (async_) { run.sandbox.__jsllTrace.uncaught(async_); return describe(async_); }
    return null;
  });
  let error = result;
  if (!error && rejections.length > 0) {
    run.sandbox.__jsllTrace.uncaught(rejections[0]);
    error = { ...describe(rejections[0]), phase: 'unhandled-rejection' };
  }
  // Objects created inside the vm belong to another realm: a JSON round-trip gives plain host objects.
  const trace = JSON.parse(JSON.stringify(run.sandbox.__jsllTrace.collect()));
  trace.file = file;
  return { trace, output: run.output, error, code: transformed.code };
}
