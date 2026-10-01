// Sandbox runtime: the only platform code that executes next to learner code.
// It lives in a cross-site, sandboxed (opaque-origin) iframe: no access to the platform page,
// its storage or its API token. It talks to the controller through postMessage only.
(() => {
  'use strict';
  const controller = window.parent;
  if (controller === window) return;

  const params = new URLSearchParams(location.search);
  const frameId = params.get('id') || '';
  const NativeBlob = Blob;
  const nativeFetch = window.fetch.bind(window);
  const nativeSetTimeout = window.setTimeout.bind(window);
  const nativeClearTimeout = window.clearTimeout.bind(window);

  // Pending short-lived async work, so non-interactive callers can tell when a program settled.
  const pending = { fetches: 0, timers: new Set() };
  const TRACKED_TIMER_MS = 1500;
  window.setTimeout = (fn, delay, ...args) => {
    const tracked = !(delay > TRACKED_TIMER_MS);
    const id = nativeSetTimeout((...a) => {
      pending.timers.delete(id);
      if (typeof fn === 'function') fn(...a);
      else (0, eval)(String(fn));
    }, delay, ...args);
    if (tracked) pending.timers.add(id);
    return id;
  };
  window.clearTimeout = (id) => { pending.timers.delete(id); nativeClearTimeout(id); };
  const trackFetch = (promise) => {
    pending.fetches += 1;
    const end = () => { pending.fetches -= 1; };
    promise.then(end, end);
    return promise;
  };
  async function quiescent(maxMs) {
    const start = performance.now();
    let calm = 0;
    while (performance.now() - start < maxMs) {
      await new Promise((r) => nativeSetTimeout(r, 15));
      if (pending.fetches === 0 && pending.timers.size === 0) { calm += 1; if (calm >= 2) return true; } else calm = 0;
    }
    return false;
  }
  const createObjectURL = URL.createObjectURL.bind(URL);

  let run = null; // active run payload
  let blobToFile = new Map();
  const scopes = new Map(); // file → getters object
  let consoleCount = 0;
  let consoleBytes = 0;
  let consoleSuppressed = false;
  let queue = [];
  let flushTimer = null;

  const post = (type, data) => controller.postMessage({ jsll: 1, frameId, runId: run ? run.runId : null, nonce: run ? run.nonce : null, type, ...data }, '*');

  // ---------- value serialization (console, assertion diffs) ----------
  const MAX_DEPTH = 4;
  const MAX_ITEMS = 60;
  const MAX_STRING = 4000;
  function serialize(value, depth = 0, seen = new Set()) {
    const type = typeof value;
    if (value === null) return { t: 'null' };
    if (type === 'undefined') return { t: 'undefined' };
    if (type === 'string') return { t: 'string', v: value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value, cut: value.length > MAX_STRING };
    if (type === 'number') return { t: 'number', v: Number.isFinite(value) && !Object.is(value, -0) ? value : String(Object.is(value, -0) ? '-0' : value) };
    if (type === 'boolean') return { t: 'boolean', v: value };
    if (type === 'bigint') return { t: 'bigint', v: `${value}n` };
    if (type === 'symbol') return { t: 'symbol', v: String(value) };
    if (type === 'function') return { t: 'function', name: value.name || '', cls: /^class\s/.test(Function.prototype.toString.call(value)) };
    if (seen.has(value)) return { t: 'circular' };
    try {
      if (value instanceof Error) return { t: 'error', name: value.name, message: String(value.message), stack: cleanStack(value.stack || '') };
      if (value instanceof Date) return { t: 'date', v: Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString() };
      if (value instanceof RegExp) return { t: 'regexp', v: String(value) };
      if (typeof Node !== 'undefined' && value instanceof Node) {
        const html = value.nodeType === 1 ? value.outerHTML : value.nodeType === 9 ? '#document' : value.textContent;
        return { t: 'node', v: String(html).slice(0, 600), name: value.nodeName };
      }
      if (value instanceof Promise) return { t: 'promise' };
      if (value instanceof WeakMap || value instanceof WeakSet) return { t: 'opaque', name: value.constructor.name };
      if (depth >= MAX_DEPTH) return { t: 'more', name: Array.isArray(value) ? `Array(${value.length})` : (value.constructor && value.constructor.name) || 'Object' };
      seen.add(value);
      let out;
      if (Array.isArray(value)) {
        const items = [];
        for (let i = 0; i < Math.min(value.length, MAX_ITEMS); i++) items.push(i in value ? serialize(value[i], depth + 1, seen) : { t: 'empty' });
        out = { t: 'array', items, length: value.length };
      } else if (value instanceof Map) {
        out = { t: 'map', size: value.size, entries: [...value.entries()].slice(0, MAX_ITEMS).map(([k, v]) => [serialize(k, depth + 1, seen), serialize(v, depth + 1, seen)]) };
      } else if (value instanceof Set) {
        out = { t: 'set', size: value.size, items: [...value.values()].slice(0, MAX_ITEMS).map((v) => serialize(v, depth + 1, seen)) };
      } else if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
        out = { t: 'typed', name: value.constructor.name, length: value.length, items: Array.from(value.slice(0, MAX_ITEMS)) };
      } else if (value instanceof ArrayBuffer) {
        out = { t: 'opaque', name: `ArrayBuffer(${value.byteLength})` };
      } else {
        const keys = Reflect.ownKeys(value);
        const entries = [];
        for (const key of keys.slice(0, MAX_ITEMS)) {
          const desc = Object.getOwnPropertyDescriptor(value, key);
          if (!desc) continue;
          const shown = typeof key === 'symbol' ? String(key) : key;
          if (desc.get || desc.set) entries.push([shown, { t: 'accessor' }]);
          else if (desc.enumerable || typeof key === 'symbol') entries.push([shown, serialize(desc.value, depth + 1, seen)]);
        }
        const proto = Object.getPrototypeOf(value);
        const ctor = proto === null ? '[null prototype]' : (proto.constructor && proto.constructor.name) || 'Object';
        out = { t: 'object', ctor, entries, more: keys.length > MAX_ITEMS };
      }
      seen.delete(value);
      return out;
    } catch (e) {
      return { t: 'opaque', name: 'unserializable' };
    }
  }

  function cleanStack(stack) {
    let s = String(stack);
    for (const [url, file] of blobToFile) s = s.split(url).join(file);
    return s
      .split('\n')
      .filter((line) => !/\/sandbox\/runtime\.js/.test(line))
      .join('\n');
  }

  function describeError(error) {
    if (error && typeof error === 'object' && 'message' in error) {
      const stack = cleanStack(error.stack || '');
      const where = /(?:\(|\s|@)([^\s()@]+?):(\d+):(\d+)\)?/.exec(stack.split('\n').slice(1).join('\n') || stack);
      return {
        name: String(error.name || 'Error'),
        message: String(error.message),
        stack,
        file: where ? where[1] : null,
        line: error.jsllLine ?? (where ? Number(where[2]) : null),
        column: where ? Number(where[3]) : null,
        loopBudgetMs: error.jsllBudgetMs ?? null,
        cause: error.cause !== undefined ? serialize(error.cause) : undefined,
      };
    }
    return { name: 'Thrown value', message: (() => { try { return String(error); } catch { return 'unprintable value'; } })(), stack: '', file: null, line: null, column: null, thrown: serialize(error) };
  }

  // ---------- console ----------
  function flush() {
    flushTimer = null;
    if (queue.length === 0) return;
    const entries = queue;
    queue = [];
    post('console', { entries });
  }
  function emitConsole(level, args) {
    if (!run) return;
    if (consoleSuppressed) return;
    const limit = run.options.consoleLimit;
    const entry = { level, args: args.map((a) => serialize(a)), at: Math.round(performance.now()) };
    consoleCount += 1;
    consoleBytes += JSON.stringify(entry).length;
    if (consoleCount > limit.entries || consoleBytes > limit.bytes) {
      consoleSuppressed = true;
      queue.push({ level: 'system', code: 'console-limit', args: [], at: entry.at });
    } else queue.push(entry);
    if (queue.length >= 50) flush();
    else if (flushTimer === null) flushTimer = nativeSetTimeout(flush, 30);
  }
  function emitSystem(code, detail) {
    if (!run) return;
    queue.push({ level: 'system', code, detail, args: [], at: Math.round(performance.now()) });
    if (flushTimer === null) flushTimer = nativeSetTimeout(flush, 30);
  }
  const captured = [];
  for (const level of ['log', 'info', 'warn', 'error', 'debug', 'table', 'dir']) {
    const original = console[level].bind(console);
    console[level] = (...args) => {
      original(...args);
      captured.push({ level, args });
      emitConsole(level === 'dir' || level === 'debug' ? 'log' : level, args);
    };
  }
  const originalAssert = console.assert.bind(console);
  console.assert = (condition, ...args) => {
    originalAssert(condition, ...args);
    if (!condition) { captured.push({ level: 'error', args: ['Assertion failed:', ...args] }); emitConsole('error', ['Assertion failed:', ...args]); }
  };
  console.clear = () => { emitSystem('console-cleared'); };
  window.alert = (message) => { captured.push({ level: 'alert', args: [message] }); emitConsole('alert', [String(message)]); };
  window.confirm = () => { emitSystem('no-confirm'); return false; };
  window.prompt = () => { emitSystem('no-prompt'); return null; };

  // ---------- errors ----------
  function reportError(error, phase) {
    flush();
    post('error', { error: describeError(error), phase });
  }
  function installListeners() {
    window.addEventListener('message', onMessage);
    window.addEventListener('error', (event) => {
      if (event.error !== undefined && event.error !== null) reportError(event.error, 'runtime');
      else if (event.message) reportError({ name: 'Error', message: event.message, stack: `${event.filename}:${event.lineno}:${event.colno}` }, 'runtime');
      else if (event.target && event.target !== window && event.target.tagName) emitSystem('resource-blocked', event.target.src || event.target.href || event.target.tagName);
    }, true);
    window.addEventListener('unhandledrejection', (event) => { reportError(event.reason, 'unhandled-rejection'); });
    // These run last (bubble phase on window), after learner handlers had their chance to call
    // preventDefault(). A real navigation would discard the running program, so it is replaced
    // by an explanation; `submitPrevented` lets tests see what the learner's handler did.
    window.addEventListener('click', (event) => {
      const link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
      if (!link || event.defaultPrevented) return;
      const href = link.getAttribute('href');
      if (href.startsWith('#')) return;
      event.preventDefault();
      const url = new URL(href, document.baseURI);
      const path = url.origin === location.origin && url.pathname.startsWith('/sandbox/') ? decodeURIComponent(url.pathname.slice('/sandbox/'.length)) : null;
      if (path !== null && run && Object.prototype.hasOwnProperty.call(run.files, path) && path.endsWith('.html')) post('navigate', { path });
      else emitSystem('navigation-blocked', href);
    });
    window.addEventListener('submit', (event) => {
      lastSubmitPrevented = event.defaultPrevented;
      if (event.defaultPrevented) return;
      const method = (event.target && event.target.getAttribute && event.target.getAttribute('method')) || 'get';
      if (method.toLowerCase() === 'dialog') return;
      event.preventDefault();
      emitSystem('form-submit-navigation');
    });
  }
  let lastSubmitPrevented = null;

  // ---------- hooks used by transformed learner code ----------
  Object.defineProperties(window, {
    __jsllLoopExceeded: {
      value: (line, budgetMs) => {
        const error = new Error(`Loop on line ${line} ran longer than ${budgetMs} ms (possible infinite loop).`);
        error.name = 'LoopBudgetError';
        error.jsllLine = line;
        error.jsllBudgetMs = budgetMs;
        throw error;
      },
    },
    __jsllScope: { value: (file, getters) => { scopes.set(file, getters); } },
    __jsllResolve: {
      value: (spec, from) => {
        if (typeof spec !== 'string' || !(spec.startsWith('./') || spec.startsWith('../') || spec.startsWith('/'))) return spec;
        const base = spec.startsWith('/') ? spec.slice(1) : `${from.includes('/') ? from.slice(0, from.lastIndexOf('/')) : ''}/${spec}`;
        const out = [];
        for (const part of base.split('/')) { if (part === '' || part === '.') continue; if (part === '..') out.pop(); else out.push(part); }
        return `~/${out.join('/')}`;
      },
    },
  });

  // ---------- isolated, learner-visible storage ----------
  function makeStorage(kind, initial) {
    const data = new Map(Object.entries(initial || {}));
    let timer = null;
    const changed = () => {
      if (kind !== 'local' || timer !== null) return;
      timer = nativeSetTimeout(() => { timer = null; post('storage', { local: Object.fromEntries(data) }); }, 20);
    };
    const api = {
      getItem: (k) => (data.has(String(k)) ? data.get(String(k)) : null),
      setItem: (k, v) => {
        const size = [...data.entries()].reduce((n, [a, b]) => n + a.length + b.length, 0) + String(k).length + String(v).length;
        if (size > run.options.storageLimitBytes) throw new DOMException(`Storage limit of ${run.options.storageLimitBytes} bytes exceeded.`, 'QuotaExceededError');
        data.set(String(k), String(v)); changed();
      },
      removeItem: (k) => { data.delete(String(k)); changed(); },
      clear: () => { data.clear(); changed(); },
      key: (i) => [...data.keys()][i] ?? null,
    };
    return new Proxy(api, {
      get: (target, prop) => (prop === 'length' ? data.size : prop in target ? target[prop] : typeof prop === 'string' && data.has(prop) ? data.get(prop) : undefined),
      set: (target, prop, value) => { target.setItem(prop, value); return true; },
      deleteProperty: (target, prop) => { target.removeItem(prop); return true; },
      ownKeys: () => [...data.keys()],
      has: (target, prop) => prop in target || data.has(prop),
      getOwnPropertyDescriptor: (target, prop) => (data.has(prop) ? { value: data.get(prop), enumerable: true, configurable: true, writable: true } : undefined),
    });
  }

  // ---------- network policy ----------
  function installNetwork() {
    const files = run.files;
    const mime = (p) => (p.endsWith('.json') ? 'application/json' : p.endsWith('.html') ? 'text/html' : p.endsWith('.css') ? 'text/css' : /\.(m?js|jsx|ts|tsx)$/.test(p) ? 'text/javascript' : 'text/plain');
    window.fetch = (input, init) => trackFetch(policyFetch(input, init));
    const policyFetch = (input, init) => {
      let url;
      try { url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, document.baseURI); } catch (e) { return Promise.reject(new TypeError(`Failed to parse URL from ${String(input)}`)); }
      if (url.origin === location.origin && url.pathname.startsWith('/sandbox/')) {
        const path = decodeURIComponent(url.pathname.slice('/sandbox/'.length));
        const signal = init && init.signal;
        return new Promise((resolve, reject) => {
          if (signal && signal.aborted) return reject(signal.reason ?? new DOMException('The operation was aborted.', 'AbortError'));
          const timer = nativeSetTimeout(() => {
            if (signal) signal.removeEventListener('abort', onAbort);
            if (Object.prototype.hasOwnProperty.call(files, path)) resolve(new Response(files[path], { status: 200, headers: { 'content-type': `${mime(path)}; charset=utf-8` } }));
            else resolve(new Response(`Not found: ${path}`, { status: 404, statusText: 'Not Found', headers: { 'content-type': 'text/plain' } }));
          }, 15);
          const onAbort = () => { nativeClearTimeout(timer); reject(signal.reason ?? new DOMException('The operation was aborted.', 'AbortError')); };
          if (signal) signal.addEventListener('abort', onAbort, { once: true });
        });
      }
      if (run.options.network === 'lab' && url.pathname.startsWith('/lab/') && run.options.labOrigins.includes(url.origin)) return nativeFetch(input, init);
      emitSystem('network-blocked', url.href);
      return Promise.reject(new TypeError('Failed to fetch (blocked by the sandbox network policy)'));
    };
    window.XMLHttpRequest = class { constructor() { throw new Error('XMLHttpRequest is not available in the sandbox. Use fetch().'); } };
  }

  // ---------- document assembly ----------
  function buildDocument() {
    const imports = {};
    blobToFile = new Map();
    for (const [path, code] of Object.entries(run.modules)) {
      const url = createObjectURL(new NativeBlob([code], { type: 'text/javascript' }));
      imports[`~/${path}`] = url;
      blobToFile.set(url, path);
    }
    for (const [spec, url] of Object.entries(run.libs || {})) imports[spec] = url;
    const classic = {};
    for (const [key, code] of Object.entries(run.classicScripts || {})) {
      const url = createObjectURL(new NativeBlob([code], { type: 'text/javascript' }));
      classic[key] = url;
      blobToFile.set(url, key);
    }
    const importMap = `<script type="importmap">${JSON.stringify({ imports }).replace(/</g, '\\u003c')}</script>`;
    let html = run.html.replace(/%%JSLL_CLASSIC:([^%]+)%%/g, (_, key) => classic[key] || '');
    html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => `${m}${importMap}`) : `${importMap}${html}`;
    return html;
  }

  // ---------- test harness ----------
  const tests = [];
  class AssertionError extends Error {
    constructor(message, detail) { super(message); this.name = 'AssertionError'; Object.assign(this, detail); }
  }
  const isObject = (v) => v !== null && typeof v === 'object';
  function deepEqual(a, b, seen = new Map()) {
    if (Object.is(a, b)) return true;
    if (!isObject(a) || !isObject(b)) return false;
    if (seen.get(a) === b) return true;
    seen.set(a, b);
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
      const plain = (v) => { const p = Object.getPrototypeOf(v); return p === null || p === Object.prototype; };
      if (!(plain(a) && plain(b)) && !(Array.isArray(a) && Array.isArray(b))) return false;
    }
    if (a instanceof Date) return a.getTime() === b.getTime();
    if (a instanceof RegExp) return String(a) === String(b);
    if (a instanceof Error) return a.name === b.name && a.message === b.message;
    if (a instanceof Map) return a.size === b.size && [...a].every(([k, v]) => b.has(k) && deepEqual(v, b.get(k), seen));
    if (a instanceof Set) return a.size === b.size && [...a].every((v) => b.has(v) || [...b].some((w) => deepEqual(v, w, seen)));
    if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((v, i) => deepEqual(v, b[i], seen));
    const ka = Object.keys(a).filter((k) => a[k] !== undefined);
    const kb = Object.keys(b).filter((k) => b[k] !== undefined);
    return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k], seen));
  }
  const show = (v) => {
    try {
      if (typeof v === 'string') return JSON.stringify(v);
      if (typeof v === 'function') return `[function ${v.name || 'anonymous'}]`;
      if (typeof v === 'bigint') return `${v}n`;
      if (typeof v === 'symbol' || v === undefined) return String(v);
      if (typeof Node !== 'undefined' && v instanceof Node) return v.nodeType === 1 ? v.outerHTML.slice(0, 200) : v.nodeName;
      if (v instanceof Error) return `${v.name}: ${v.message}`;
      if (v instanceof Map) return `Map(${v.size}) ${JSON.stringify([...v])}`;
      if (v instanceof Set) return `Set(${v.size}) ${JSON.stringify([...v])}`;
      const s = JSON.stringify(v, (k, x) => (typeof x === 'bigint' ? `${x}n` : x === undefined ? '__undefined__' : typeof x === 'function' ? `[function ${x.name}]` : typeof x === 'number' && !Number.isFinite(x) ? String(x) : x));
      return s === undefined ? String(v) : s.replace(/"__undefined__"/g, 'undefined').slice(0, 800);
    } catch (e) { return Object.prototype.toString.call(v); }
  };
  function makeExpect(actual, negate = false, hint = '') {
    const check = (pass, text, extra = {}) => {
      if (pass === negate) throw new AssertionError(`${hint ? `${hint}: ` : ''}expected ${show(actual)} ${negate ? 'not ' : ''}${text}`, { actual: serialize(actual), ...extra });
    };
    const m = {
      toBe: (e) => check(Object.is(actual, e), `to be ${show(e)}`, { expected: serialize(e) }),
      toEqual: (e) => check(deepEqual(actual, e), `to equal ${show(e)}`, { expected: serialize(e) }),
      toBeTruthy: () => check(Boolean(actual), 'to be truthy'),
      toBeFalsy: () => check(!actual, 'to be falsy'),
      toBeNull: () => check(actual === null, 'to be null'),
      toBeUndefined: () => check(actual === undefined, 'to be undefined'),
      toBeDefined: () => check(actual !== undefined, 'to be defined'),
      toBeNaN: () => check(Number.isNaN(actual), 'to be NaN'),
      toBeGreaterThan: (e) => check(actual > e, `to be greater than ${show(e)}`),
      toBeGreaterThanOrEqual: (e) => check(actual >= e, `to be greater than or equal to ${show(e)}`),
      toBeLessThan: (e) => check(actual < e, `to be less than ${show(e)}`),
      toBeLessThanOrEqual: (e) => check(actual <= e, `to be less than or equal to ${show(e)}`),
      toBeCloseTo: (e, digits = 2) => check(Math.abs(actual - e) < 10 ** -digits / 2, `to be close to ${show(e)}`),
      toBeInstanceOf: (c) => check(actual instanceof c, `to be an instance of ${c.name}`),
      toBeTypeOf: (t) => check(typeof actual === t, `to have type ${show(t)} (got ${show(typeof actual)})`),
      toContain: (e) => check(typeof actual === 'string' ? actual.includes(e) : Array.from(actual ?? []).some((v) => Object.is(v, e)), `to contain ${show(e)}`),
      toContainEqual: (e) => check(Array.from(actual ?? []).some((v) => deepEqual(v, e)), `to contain an item equal to ${show(e)}`),
      toHaveLength: (n) => check(actual != null && actual.length === n, `to have length ${n}${actual != null && 'length' in Object(actual) ? ` (got ${actual.length})` : ''}`),
      toHaveProperty: (key, ...value) => {
        const has = actual != null && key in Object(actual);
        check(has && (value.length === 0 || deepEqual(actual[key], value[0])), `to have property ${show(key)}${value.length ? ` equal to ${show(value[0])}` : ''}`);
      },
      toMatch: (re) => check(typeof actual === 'string' && (re instanceof RegExp ? re.test(actual) : actual.includes(re)), `to match ${String(re)}`),
      toMatchObject: (e) => check(isObject(actual) && Object.keys(e).every((k) => deepEqual(actual[k], e[k])), `to match object ${show(e)}`, { expected: serialize(e) }),
      toThrow: (expected) => {
        let thrown = null; let did = false;
        try { actual(); } catch (e) { did = true; thrown = e; }
        const matches = !did ? false : expected === undefined ? true : typeof expected === 'string' ? String(thrown && thrown.message).includes(expected) : expected instanceof RegExp ? expected.test(String(thrown && thrown.message)) : thrown instanceof expected;
        if (matches === negate) throw new AssertionError(`${hint ? `${hint}: ` : ''}expected the function ${negate ? 'not ' : ''}to throw${expected !== undefined ? ` ${typeof expected === 'function' ? expected.name : show(expected)}` : ''}${did ? ` (it threw ${show(thrown)})` : ' (it did not throw)'}`, {});
      },
      toHaveBeenCalled: () => check(actual && actual.calls && actual.calls.length > 0, 'to have been called'),
      toHaveBeenCalledTimes: (n) => check(actual && actual.calls && actual.calls.length === n, `to have been called ${n} time(s)${actual && actual.calls ? ` (was called ${actual.calls.length})` : ''}`),
      toHaveBeenCalledWith: (...args) => check(actual && actual.calls && actual.calls.some((c) => deepEqual(c, args)), `to have been called with ${show(args)}`),
      toHaveTextContent: (text) => { const t = actual ? actual.textContent.replace(/\s+/g, ' ').trim() : ''; check(text instanceof RegExp ? text.test(t) : t.includes(text), `to have text ${show(String(text))} (text is ${show(t)})`); },
      toBeVisible: () => check(Boolean(actual) && actual.isConnected && getComputedStyle(actual).display !== 'none' && getComputedStyle(actual).visibility !== 'hidden' && !actual.closest('[hidden]'), 'to be visible'),
      toBeInTheDocument: () => check(Boolean(actual) && actual.isConnected, 'to be in the document'),
      toHaveFocus: () => check(document.activeElement === actual, `to have focus (focus is on ${show(document.activeElement)})`),
      toHaveValue: (v) => check(actual && actual.value === v, `to have value ${show(v)}${actual ? ` (value is ${show(actual.value)})` : ''}`),
      toHaveAttribute: (name, ...value) => check(actual && actual.hasAttribute(name) && (value.length === 0 || actual.getAttribute(name) === value[0]), `to have attribute ${name}${value.length ? `=${show(value[0])}` : ''}`),
      toHaveClass: (name) => check(actual && actual.classList.contains(name), `to have class ${show(name)}`),
      toBeDisabled: () => check(actual && actual.disabled === true, 'to be disabled'),
      toBeChecked: () => check(actual && actual.checked === true, 'to be checked'),
    };
    return m;
  }
  function expect(actual, hint) {
    const base = makeExpect(actual, false, hint);
    base.not = makeExpect(actual, true, hint);
    const asyncMatchers = (settle) => new Proxy({}, {
      get: (_, name) => async (...args) => { const value = await settle(); const e = makeExpect(value, false, hint); return e[name](...args); },
    });
    base.resolves = asyncMatchers(() => actual);
    base.rejects = asyncMatchers(async () => { try { await actual; } catch (e) { return e; } throw new AssertionError('expected the promise to reject, but it resolved', {}); });
    return base;
  }
  function spy(impl) {
    const fn = function (...args) { fn.calls.push(args); const r = impl ? impl.apply(this, args) : undefined; fn.results.push(r); return r; };
    fn.calls = []; fn.results = [];
    return fn;
  }
  const sleep = (ms) => new Promise((r) => nativeSetTimeout(r, ms));
  // Two macrotask turns let event handlers, promise chains and framework schedulers flush.
  // (No requestAnimationFrame here: browsers pause it in frames that are not on screen.)
  const settle = async () => { await new Promise((r) => nativeSetTimeout(r, 0)); await new Promise((r) => nativeSetTimeout(r, 4)); };
  async function waitFor(check, { timeout = 1500, interval = 25 } = {}) {
    const start = performance.now();
    let lastError;
    for (;;) {
      try { const v = await check(); if (v !== false) return v; lastError = new AssertionError('waitFor: the condition stayed false', {}); } catch (e) { lastError = e; }
      if (performance.now() - start > timeout) throw lastError;
      await sleep(interval);
    }
  }
  const el = (target) => {
    const node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!node) throw new AssertionError(`element not found: ${typeof target === 'string' ? target : 'null'}`, {});
    return node;
  };
  const setNativeValue = (node, value) => {
    const proto = node instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : node instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(node, value);
  };
  const user = {
    async click(target) {
      const node = el(target);
      if (node.disabled) { await settle(); return; }
      if (typeof node.focus === 'function') node.focus();
      for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) node.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
      node.click();
      await settle();
    },
    async type(target, text) {
      const node = el(target);
      node.focus();
      for (const ch of String(text)) {
        const down = new KeyboardEvent('keydown', { key: ch, bubbles: true, cancelable: true });
        if (node.dispatchEvent(down)) {
          setNativeValue(node, node.value + ch);
          node.dispatchEvent(new InputEvent('input', { bubbles: true, data: ch, inputType: 'insertText' }));
        }
        node.dispatchEvent(new KeyboardEvent('keyup', { key: ch, bubbles: true }));
      }
      await settle();
    },
    async clear(target) {
      const node = el(target);
      node.focus(); setNativeValue(node, '');
      node.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }));
      await settle();
    },
    async fill(target, text) { await user.clear(target); await user.type(target, text); const node = el(target); node.dispatchEvent(new Event('change', { bubbles: true })); await settle(); },
    async select(target, value) {
      const node = el(target);
      node.focus(); setNativeValue(node, value);
      node.dispatchEvent(new Event('input', { bubbles: true })); node.dispatchEvent(new Event('change', { bubbles: true }));
      await settle();
    },
    async check(target, checked = true) { const node = el(target); if (node.checked !== checked) await user.click(node); },
    async press(key, target) {
      const node = target ? el(target) : document.activeElement || document.body;
      const down = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      const proceed = node.dispatchEvent(down);
      if (proceed) {
        if (key === 'Enter' && node.form && node.tagName === 'INPUT') node.form.requestSubmit();
        else if ((key === 'Enter' || key === ' ') && (node.tagName === 'BUTTON' || (node.tagName === 'A' && key === 'Enter'))) node.click();
        else if (key === 'Tab') {
          const focusable = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter((n) => !n.disabled && n.tabIndex >= 0 && n.getClientRects().length > 0);
          const next = focusable[(focusable.indexOf(node) + 1) % focusable.length];
          if (next) next.focus();
        }
      }
      node.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
      await settle();
    },
    async submit(target) { lastSubmitPrevented = null; el(target).requestSubmit(); await settle(); return { prevented: lastSubmitPrevented === true }; },
  };
  const textOf = (n) => n.textContent.replace(/\s+/g, ' ').trim();
  function accessibleName(node) {
    const labelledby = node.getAttribute('aria-labelledby');
    if (labelledby) return labelledby.split(/\s+/).map((id) => { const n = document.getElementById(id); return n ? textOf(n) : ''; }).join(' ').trim();
    if (node.getAttribute('aria-label')) return node.getAttribute('aria-label').trim();
    if (node.labels && node.labels.length) return [...node.labels].map(textOf).join(' ').trim();
    if (node.tagName === 'IMG') return (node.getAttribute('alt') || '').trim();
    if (node.tagName === 'INPUT' && ['button', 'submit', 'reset'].includes(node.type)) return node.value;
    return textOf(node) || (node.getAttribute('title') || '').trim();
  }
  const implicitRole = (node) => {
    const tag = node.tagName;
    if (node.getAttribute('role')) return node.getAttribute('role');
    if (tag === 'BUTTON' || (tag === 'INPUT' && ['button', 'submit', 'reset'].includes(node.type))) return 'button';
    if (tag === 'A' && node.hasAttribute('href')) return 'link';
    if (tag === 'INPUT') return node.type === 'checkbox' ? 'checkbox' : node.type === 'radio' ? 'radio' : node.type === 'range' ? 'slider' : node.type === 'number' ? 'spinbutton' : 'textbox';
    if (tag === 'TEXTAREA') return 'textbox';
    if (tag === 'SELECT') return node.multiple ? 'listbox' : 'combobox';
    if (/^H[1-6]$/.test(tag)) return 'heading';
    return { UL: 'list', OL: 'list', LI: 'listitem', NAV: 'navigation', MAIN: 'main', IMG: 'img', TABLE: 'table', TR: 'row', TD: 'cell', TH: 'columnheader', FORM: 'form', DIALOG: 'dialog', HEADER: 'banner', FOOTER: 'contentinfo', ARTICLE: 'article', SECTION: 'region', OPTION: 'option', PROGRESS: 'progressbar' }[tag] || null;
  };
  const matchText = (actual, wanted) => (wanted instanceof RegExp ? wanted.test(actual) : actual === wanted || actual.toLowerCase().includes(String(wanted).toLowerCase()));
  const screen = {
    $: (sel) => document.querySelector(sel),
    $$: (sel) => [...document.querySelectorAll(sel)],
    allByRole: (role, opts = {}) => [...document.querySelectorAll('*')].filter((n) => implicitRole(n) === role && (opts.name === undefined || matchText(accessibleName(n), opts.name))),
    byRole: (role, opts) => screen.allByRole(role, opts)[0] || null,
    allByText: (text) => [...document.querySelectorAll('body *')].filter((n) => ![...n.children].some((c) => matchText(textOf(c), text)) && matchText(textOf(n), text) && !['SCRIPT', 'STYLE'].includes(n.tagName)),
    byText: (text) => screen.allByText(text)[0] || null,
    byLabel: (text) => [...document.querySelectorAll('input,select,textarea,button,[role]')].find((n) => matchText(accessibleName(n), text)) || null,
    nameOf: accessibleName,
    roleOf: implicitRole,
    text: () => textOf(document.body),
  };
  function mockFetch(routes) {
    const calls = [];
    const handler = typeof routes === 'function' ? routes : (url, init) => {
      const key = Object.keys(routes).find((k) => url.pathname === k || url.href.endsWith(k) || `${(init && init.method) || 'GET'} ${url.pathname}` === k);
      return key === undefined ? { status: 404, body: { error: 'not found' } } : typeof routes[key] === 'function' ? routes[key](url, init) : routes[key];
    };
    const original = window.fetch;
    window.fetch = (input, init = {}) => new Promise((resolve, reject) => {
      const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, document.baseURI);
      calls.push({ url: url.href, path: url.pathname + url.search, method: (init.method || 'GET').toUpperCase(), body: init.body, headers: init.headers });
      const signal = init.signal;
      if (signal && signal.aborted) return reject(signal.reason ?? new DOMException('The operation was aborted.', 'AbortError'));
      Promise.resolve(handler(url, init)).then((spec) => {
        const finish = () => {
          if (spec.networkError) return reject(new TypeError('Failed to fetch'));
          const body = spec.body === undefined ? '' : typeof spec.body === 'string' ? spec.body : JSON.stringify(spec.body);
          const headers = { 'content-type': typeof spec.body === 'string' ? 'text/plain' : 'application/json', ...(spec.headers || {}) };
          resolve(new Response([204, 304].includes(spec.status) ? null : body, { status: spec.status || 200, statusText: spec.statusText || '', headers }));
        };
        const timer = nativeSetTimeout(finish, spec.delay || 0);
        if (signal) signal.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason ?? new DOMException('The operation was aborted.', 'AbortError')); }, { once: true });
      }, reject);
    });
    return { calls, restore: () => { window.fetch = original; } };
  }

  async function runTests() {
    const scope = new Proxy({}, {
      get: (_, name) => { for (const file of [run.scopeFile, ...scopes.keys()]) { const g = scopes.get(file); if (g && name in g) { try { return g[name]; } catch (e) { return undefined; } } } return undefined; },
      has: (_, name) => [...scopes.values()].some((g) => name in g),
    });
    const api = {
      test: (name, fn) => { tests.push({ name, fn }); },
      expect, spy, sleep, settle, waitFor, user, screen, mockFetch, scope,
      scopeOf: (file) => scopes.get(file) || {},
      logs: () => captured.filter((c) => c.level !== 'alert').map((c) => c.args.map((a) => (typeof a === 'string' ? a : show(a))).join(' ')),
      rawLogs: () => captured.map((c) => ({ level: c.level, args: c.args })),
      alerts: () => captured.filter((c) => c.level === 'alert').map((c) => String(c.args[0])),
      loadError: () => loadErrors[0] || null,
      storage: window.localStorage,
      files: run.files,
      // Localized example text of this exercise in the learner's language (see %%key%% placeholders).
      L: run.options.strings || {},
    };
    Object.assign(window, api);
    const results = [];
    try {
      await import(`~/${run.tests.path}`);
    } catch (error) {
      post('tests', { results: [], harnessError: describeError(error) });
      return;
    }
    for (const t of tests) {
      const started = performance.now();
      let outcome = { name: t.name, status: 'pass' };
      try {
        await Promise.race([
          Promise.resolve().then(() => t.fn()),
          new Promise((_, reject) => nativeSetTimeout(() => reject(new AssertionError(`test timed out after ${run.options.testTimeoutMs} ms`, {})), run.options.testTimeoutMs)),
        ]);
      } catch (error) {
        const d = describeError(error);
        outcome = { name: t.name, status: 'fail', message: d.message, errorName: d.name, expected: error && error.expected, actual: error && error.actual, stack: d.name === 'AssertionError' ? undefined : d.stack };
      }
      outcome.ms = Math.round(performance.now() - started);
      results.push(outcome);
    }
    flush();
    post('tests', { results });
  }

  // ---------- run lifecycle ----------
  const loadErrors = [];
  function start(payload) {
    run = payload;
    consoleCount = 0; consoleBytes = 0; consoleSuppressed = false; captured.length = 0;
    Object.defineProperty(window, 'localStorage', { value: makeStorage('local', run.storage && run.storage.local), configurable: true });
    Object.defineProperty(window, 'sessionStorage', { value: makeStorage('session', {}), configurable: true });
    installNetwork();
    if (run.options.offscreen) {
      // Off-screen frames never get animation frames; keep animation code observable in checks.
      let rafId = 0;
      const rafTimers = new Map();
      window.requestAnimationFrame = (cb) => { const id = (rafId += 1); rafTimers.set(id, nativeSetTimeout(() => { rafTimers.delete(id); cb(performance.now()); }, 16)); return id; };
      window.cancelAnimationFrame = (id) => { nativeClearTimeout(rafTimers.get(id)); rafTimers.delete(id); };
    }
    const html = buildDocument();
    document.open();
    installListeners();
    window.addEventListener('error', (event) => { if (event.error) loadErrors.push(describeError(event.error)); });
    window.addEventListener('load', () => {
      nativeSetTimeout(async () => {
        // Module entries may still be evaluating (top-level await): wait for them, then for
        // short-lived async work, before checking behavior or reporting completion.
        const limit = run.options.settleTimeoutMs;
        await Promise.race([
          Promise.allSettled((run.entryModules || []).map((spec) => import(spec))),
          new Promise((r) => nativeSetTimeout(r, limit)),
        ]);
        await quiescent(limit);
        flush();
        post('loaded', {});
        // Optional execution trace (step-through visual of the learner's own code).
        if (run.options.trace && window.__jsllTrace && typeof window.__jsllTrace.collect === 'function') {
          try { post('trace', { trace: window.__jsllTrace.collect() }); } catch (error) { reportError(error, 'trace'); }
        }
        if (run.tests) await runTests();
        await quiescent(Math.min(limit, 1000));
        flush();
        post('done', {});
      }, 0);
    });
    document.write(html);
    document.close();
  }

  function onMessage(event) {
    if (event.source !== controller) return;
    const message = event.data;
    if (!message || message.jsll !== 1 || message.frameId !== frameId) return;
    if (message.type === 'ping') post('pong', { seq: message.seq });
    else if (message.type === 'run' && run === null) {
      try { start(message.payload); } catch (error) { reportError(error, 'bootstrap'); post('done', {}); }
    }
  }

  window.addEventListener('message', onMessage);
  post('ready', {});
})();
