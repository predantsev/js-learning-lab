// Assertions for Node-stage checks. A port of the non-DOM part of sandbox/runtime.js: the same
// matcher names, semantics and failure messages, so lessons read the same in every stage.

export class AssertionError extends Error {
  constructor(message, detail) {
    super(message);
    this.name = 'AssertionError';
    Object.assign(this, detail);
  }
}

// ---------- value serialization (assertion diffs) — same shape as the browser runner ----------
const MAX_DEPTH = 4;
const MAX_ITEMS = 60;
const MAX_STRING = 4000;

export function serialize(value, depth = 0, seen = new Set()) {
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
    if (value instanceof Error) return { t: 'error', name: value.name, message: String(value.message), stack: String(value.stack || '') };
    if (value instanceof Date) return { t: 'date', v: Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString() };
    if (value instanceof RegExp) return { t: 'regexp', v: String(value) };
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
  } catch {
    return { t: 'opaque', name: 'unserializable' };
  }
}

const isObject = (v) => v !== null && typeof v === 'object';

export function deepEqual(a, b, seen = new Map()) {
  if (Object.is(a, b)) return true;
  if (!isObject(a) || !isObject(b)) return false;
  if (seen.get(a) === b) return true;
  seen.set(a, b);
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
    const plain = (v) => {
      const p = Object.getPrototypeOf(v);
      return p === null || p === Object.prototype;
    };
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

export const show = (v) => {
  try {
    if (typeof v === 'string') return JSON.stringify(v);
    if (typeof v === 'function') return `[function ${v.name || 'anonymous'}]`;
    if (typeof v === 'bigint') return `${v}n`;
    if (typeof v === 'symbol' || v === undefined) return String(v);
    if (v instanceof Error) return `${v.name}: ${v.message}`;
    if (v instanceof Map) return `Map(${v.size}) ${JSON.stringify([...v])}`;
    if (v instanceof Set) return `Set(${v.size}) ${JSON.stringify([...v])}`;
    if (Buffer.isBuffer(v)) return `<Buffer ${v.subarray(0, 32).toString('hex').replace(/(..)(?!$)/g, '$1 ')}${v.length > 32 ? ' …' : ''}>`;
    const s = JSON.stringify(v, (k, x) => (typeof x === 'bigint' ? `${x}n` : x === undefined ? '__undefined__' : typeof x === 'function' ? `[function ${x.name}]` : typeof x === 'number' && !Number.isFinite(x) ? String(x) : x));
    return s === undefined ? String(v) : s.replace(/"__undefined__"/g, 'undefined').slice(0, 800);
  } catch {
    return Object.prototype.toString.call(v);
  }
};

function makeExpect(actual, negate = false, hint = '') {
  const check = (pass, text, extra = {}) => {
    if (pass === negate) throw new AssertionError(`${hint ? `${hint}: ` : ''}expected ${show(actual)} ${negate ? 'not ' : ''}${text}`, { actual: serialize(actual), ...extra });
  };
  return {
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
      let thrown = null;
      let did = false;
      try {
        actual();
      } catch (e) {
        did = true;
        thrown = e;
      }
      const matches = !did ? false : expected === undefined ? true : typeof expected === 'string' ? String(thrown && thrown.message).includes(expected) : expected instanceof RegExp ? expected.test(String(thrown && thrown.message)) : thrown instanceof expected;
      if (matches === negate) throw new AssertionError(`${hint ? `${hint}: ` : ''}expected the function ${negate ? 'not ' : ''}to throw${expected !== undefined ? ` ${typeof expected === 'function' ? expected.name : show(expected)}` : ''}${did ? ` (it threw ${show(thrown)})` : ' (it did not throw)'}`, {});
    },
    toHaveBeenCalled: () => check(actual && actual.calls && actual.calls.length > 0, 'to have been called'),
    toHaveBeenCalledTimes: (n) => check(actual && actual.calls && actual.calls.length === n, `to have been called ${n} time(s)${actual && actual.calls ? ` (was called ${actual.calls.length})` : ''}`),
    toHaveBeenCalledWith: (...args) => check(actual && actual.calls && actual.calls.some((c) => deepEqual(c, args)), `to have been called with ${show(args)}`),
  };
}

export function expect(actual, hint) {
  const base = makeExpect(actual, false, hint);
  base.not = makeExpect(actual, true, hint);
  const asyncMatchers = (settle) => new Proxy({}, {
    get: (_, name) => async (...args) => {
      const value = await settle();
      const e = makeExpect(value, false, hint);
      return e[name](...args);
    },
  });
  base.resolves = asyncMatchers(() => actual);
  base.rejects = asyncMatchers(async () => {
    try {
      await actual;
    } catch (e) {
      return e;
    }
    throw new AssertionError('expected the promise to reject, but it resolved', {});
  });
  return base;
}

export function spy(impl) {
  const fn = function (...args) {
    fn.calls.push(args);
    const r = impl ? impl.apply(this, args) : undefined;
    fn.results.push(r);
    return r;
  };
  fn.calls = [];
  fn.results = [];
  return fn;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function waitFor(check, { timeout = 1500, interval = 25 } = {}) {
  const start = performance.now();
  let lastError;
  for (;;) {
    try {
      const v = await check();
      if (v !== false) return v;
      lastError = new AssertionError('waitFor: the condition stayed false', {});
    } catch (e) {
      lastError = e;
    }
    if (performance.now() - start > timeout) throw lastError;
    await sleep(interval);
  }
}
