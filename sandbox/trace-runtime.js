// Execution trace collector: defines window.__jsllTrace, the only runtime API the trace-instrumented
// code (shared/visuals/tracer.js) calls. It runs in two places with one implementation:
//   - in the sandbox frame (inlined before sandbox/runtime.js by scripts/build-sandbox.mjs) when a
//     learner steps through their own code: the runtime posts collect() as a `trace` event;
//   - in node:vm at content build time (shared/visuals/exec-node.js) to generate `code-trace` steps.
// Classic script, no dependencies. Produces the same shape as a compiled `code-trace` spec:
//   { version, file, steps: [...], console: [{ step, level, text }], truncated, maxSteps, error }
(() => {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  if (root.__jsllTrace) return;

  const DEFAULTS = { maxSteps: 400, maxHeap: 40, maxProps: 24, maxDepth: 3, maxString: 200, maxFrames: 8 };
  let config = { ...DEFAULTS };

  // ---------- state ----------
  let steps = [];
  let consoleLog = [];
  let truncated = false;
  let fatal = null;
  let frames = []; // active call stack, bottom → top
  let instSeq = 0;
  let frameSeq = 0;
  let heapIds = new WeakMap();
  let heapSeq = 0;
  let fnScopes = new WeakMap(); // function → scope instance it was created in
  let recordedErrors = new WeakSet();

  const reset = () => {
    steps = []; consoleLog = []; truncated = false; fatal = null; frames = [];
    instSeq = 0; frameSeq = 0; heapIds = new WeakMap(); heapSeq = 0; fnScopes = new WeakMap(); recordedErrors = new WeakSet();
  };

  // ---------- console text (one definition for build time and run time) ----------
  function formatValue(value, depth) {
    const type = typeof value;
    if (value === null) return 'null';
    if (type === 'undefined') return 'undefined';
    if (type === 'string') return depth === 0 ? value : JSON.stringify(value);
    if (type === 'number') return Object.is(value, -0) ? '-0' : String(value);
    if (type === 'boolean' || type === 'symbol') return String(value);
    if (type === 'bigint') return `${value}n`;
    if (type === 'function') return `ƒ ${value.name || '(anonymous)'}`;
    if (depth >= 3) return Array.isArray(value) ? `Array(${value.length})` : '{…}';
    try {
      if (value instanceof Error) return `${value.name}: ${value.message}`;
      if (value instanceof Date) return value.toISOString();
      if (value instanceof RegExp) return String(value);
      if (value instanceof Promise) return 'Promise';
      if (value instanceof Map) return `Map(${value.size}) {${[...value.entries()].slice(0, 20).map(([k, v]) => `${formatValue(k, depth + 1)} => ${formatValue(v, depth + 1)}`).join(', ')}}`;
      if (value instanceof Set) return `Set(${value.size}) {${[...value.values()].slice(0, 20).map((v) => formatValue(v, depth + 1)).join(', ')}}`;
      if (Array.isArray(value)) return `[${value.slice(0, 50).map((v) => formatValue(v, depth + 1)).join(', ')}${value.length > 50 ? ', …' : ''}]`;
      const keys = Object.keys(value).slice(0, 30);
      if (keys.length === 0) return '{}';
      return `{ ${keys.map((k) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${formatValue(value[k], depth + 1)}`).join(', ')} }`;
    } catch {
      return '[object]';
    }
  }
  const format = (args) => Array.from(args, (a) => formatValue(a, 0)).join(' ');

  // ---------- value snapshots ----------
  const heapId = (obj) => {
    let id = heapIds.get(obj);
    if (id === undefined) { id = (heapSeq += 1); heapIds.set(obj, id); }
    return id;
  };
  function snapshotValue(value, pending) {
    const type = typeof value;
    if (value === null) return { t: 'null' };
    if (type === 'undefined') return { t: 'undefined' };
    if (type === 'string') return value.length > config.maxString ? { t: 'string', v: `${value.slice(0, config.maxString)}…`, cut: true } : { t: 'string', v: value };
    if (type === 'number') return Number.isFinite(value) && !Object.is(value, -0) ? { t: 'number', v: value } : { t: 'number', v: Object.is(value, -0) ? '-0' : String(value) };
    if (type === 'boolean') return { t: 'boolean', v: value };
    if (type === 'bigint') return { t: 'bigint', v: `${value}n` };
    if (type === 'symbol') return { t: 'symbol', v: String(value) };
    const id = heapId(value);
    pending.push({ obj: value, id });
    return { t: 'ref', id };
  }
  function snapshotObject(obj, pending) {
    try {
      if (typeof obj === 'function') {
        const src = Function.prototype.toString.call(obj);
        const scope = fnScopes.get(obj);
        return { t: /^class[\s{]/.test(src) ? 'class' : 'function', name: obj.name || '', arrow: /^(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/.test(src), scope: scope ? scope.id : null, scopeName: scope ? (scope.kind === 'module' ? scope.name : scope.name || scope.kind) : null };
      }
      if (obj instanceof Error) return { t: 'error', name: obj.name, message: String(obj.message) };
      if (obj instanceof Date) return { t: 'date', v: Number.isNaN(obj.getTime()) ? 'Invalid Date' : obj.toISOString() };
      if (obj instanceof RegExp) return { t: 'regexp', v: String(obj) };
      if (obj instanceof Promise) return { t: 'promise' };
      if (obj instanceof Map) return { t: 'map', size: obj.size, entries: [...obj.entries()].slice(0, config.maxProps).map(([k, v]) => [snapshotValue(k, pending), snapshotValue(v, pending)]) };
      if (obj instanceof Set) return { t: 'set', size: obj.size, items: [...obj.values()].slice(0, config.maxProps).map((v) => snapshotValue(v, pending)) };
      if (Array.isArray(obj)) {
        const items = [];
        for (let i = 0; i < Math.min(obj.length, config.maxProps); i++) items.push(i in obj ? snapshotValue(obj[i], pending) : { t: 'empty' });
        return { t: 'array', length: obj.length, items, more: Math.max(0, obj.length - config.maxProps) };
      }
      const keys = Reflect.ownKeys(obj).filter((k) => typeof k === 'string');
      const props = [];
      for (const key of keys.slice(0, config.maxProps)) {
        const desc = Object.getOwnPropertyDescriptor(obj, key);
        if (!desc || !desc.enumerable) continue;
        // Never invoke accessors: reading learner objects at every statement must stay side-effect free.
        props.push([key, desc.get || desc.set ? { t: 'accessor' } : snapshotValue(desc.value, pending)]);
      }
      const proto = Object.getPrototypeOf(obj);
      const ctor = proto === null ? null : (proto.constructor && proto.constructor.name) || 'Object';
      return { t: 'object', ctor: ctor === 'Object' ? null : ctor, props, more: Math.max(0, keys.length - config.maxProps) };
    } catch {
      return { t: 'opaque' };
    }
  }
  const readVar = (getter) => {
    try {
      return { value: getter() };
    } catch (error) {
      if (error instanceof ReferenceError || (error && error.name === 'ReferenceError')) return { uninit: true };
      return { opaque: true };
    }
  };

  // ---------- scopes and frames ----------
  const makeInst = (def, parent, frame) => ({ id: (instSeq += 1), kind: def.kind, name: def.name || '', file: def.file || (parent ? parent.file : ''), vars: def.vars || [], parent: parent || null, frame });
  const findFrameOf = (inst) => inst.frame;

  function snapshot(line, col, endLine, kind, inst, event) {
    if (truncated) return null;
    if (steps.length >= config.maxSteps) { truncated = true; return null; }
    const pending = [];
    const scopes = {};
    const visited = new Set();
    const addChain = (start) => {
      let s = start;
      while (s && !visited.has(s.id)) {
        visited.add(s.id);
        const vars = s.vars.map(([name, varKind, getter]) => {
          const r = readVar(getter);
          if (r.uninit) return { name, kind: varKind, uninit: true };
          if (r.opaque) return { name, kind: varKind, value: { t: 'opaque' } };
          return { name, kind: varKind, value: snapshotValue(r.value, pending) };
        });
        scopes[s.id] = { id: s.id, kind: s.kind, name: s.name, parent: s.parent ? s.parent.id : null, vars };
        if (s.iteration) scopes[s.id].iteration = s.iteration;
        s = s.parent;
      }
    };
    const shownFrames = frames.slice(-config.maxFrames);
    for (const f of shownFrames) addChain(f.current);
    if (inst) addChain(inst);
    // Heap: breadth-first from the shown bindings, bounded in depth and size.
    const heap = {};
    const depthOf = new Map();
    let heapTruncated = false;
    let queue = pending.map((p) => ({ ...p, depth: 1 }));
    while (queue.length > 0) {
      const next = [];
      for (const { obj, id, depth } of queue) {
        if (heap[id] || depthOf.has(id)) continue;
        if (Object.keys(heap).length >= config.maxHeap) { heapTruncated = true; break; }
        depthOf.set(id, depth);
        const nested = [];
        heap[id] = snapshotObject(obj, nested);
        if (depth < config.maxDepth) for (const n of nested) next.push({ ...n, depth: depth + 1 });
      }
      if (heapTruncated) break;
      queue = next;
    }
    const top = frames[frames.length - 1];
    const step = {
      i: steps.length,
      line, col, endLine, kind,
      file: inst ? inst.file : (top ? top.scope.file : ''),
      frames: frames.map((f) => ({ id: f.id, name: f.name, line: f.line, scope: f.current ? f.current.id : null, kind: f.scope && f.scope.kind === 'module' ? 'module' : 'function', file: (f.current || f.scope || {}).file || '' })),
      frameId: top ? top.id : null,
      scope: inst ? inst.id : null,
      scopes,
      heap,
      heapTruncated,
    };
    if (event) step.event = event;
    steps.push(step);
    return step;
  }

  const api = {
    configure(options) { config = { ...DEFAULTS, ...(options || {}) }; },
    reset,
    format,
    /** Enter a lexical block scope instance. def = { kind, name, vars: [[name, kind, getter]] }. */
    enter(def, parent) {
      const frame = frames[frames.length - 1] || null;
      const inst = makeInst(def, parent, frame);
      if (frame) frame.current = inst;
      return inst;
    },
    /** A fresh per-iteration instance of a for(let …) head scope (closures capture the current one). */
    loop(def, previous, parent) {
      const frame = frames[frames.length - 1] || null;
      const inst = makeInst(def, parent, frame);
      inst.iteration = previous ? previous.iteration + 1 : 1;
      if (frame) frame.current = inst;
      return inst;
    },
    /**
     * Remember the scope a function value was created in (closure link shown in the heap). `name`
     * is the name the engine infers from the position (`const f = () => …`); wrapping the
     * expression in this call defeats that inference, so it is restored here.
     */
    fn(value, inst, name) {
      if (typeof value === 'function') {
        if (inst) fnScopes.set(value, inst);
        if (name && value.name === '') {
          try { Object.defineProperty(value, 'name', { value: name, configurable: true }); } catch { /* frozen: keep it */ }
        }
      }
      return value;
    },
    /** The frame starts evaluating an expression on `line` that has no step of its own (a return value, an iterated collection). No step. */
    pos(frame, line, inst) {
      if (frame) {
        frame.line = line;
        if (inst) frame.current = inst;
      }
    },
    /** Enter a function (or the module itself): pushes a call-stack frame and its function scope. */
    call(def, parent) {
      const frame = { id: (frameSeq += 1), name: def.name || '(anonymous)', line: def.line || 0, endLine: def.endLine || def.line || 0, scope: null, current: null, returned: false };
      const inst = makeInst(def, parent, frame);
      frame.scope = inst;
      frame.current = inst;
      const caller = frames[frames.length - 1];
      frames.push(frame);
      if (def.kind !== 'module') {
        const pending = [];
        const args = inst.vars.filter(([, kind]) => kind === 'param').map(([name, , getter]) => {
          const r = readVar(getter);
          return { name, value: r.value !== undefined || !(r.uninit || r.opaque) ? snapshotValue(r.value, pending) : { t: 'undefined' } };
        });
        snapshot(def.line || 0, def.col || 0, def.line || 0, 'call', inst, { type: 'call', name: frame.name, args, from: caller ? caller.line : null });
      }
      return frame;
    },
    /** Record a step: the state *before* the statement at line/col runs. */
    at(line, col, endLine, kind, inst) {
      const top = frames[frames.length - 1];
      if (top) { top.line = line; if (inst) top.current = inst; }
      snapshot(line, col, endLine, kind, inst || (top ? top.current : null), null);
    },
    returning(frame, value, line, col) {
      if (frame) { frame.returned = true; frame.line = line || frame.line; }
      const pending = [];
      snapshot(line || (frame ? frame.line : 0), col || 0, line || 0, 'return', frame ? frame.current : null, { type: 'return', name: frame ? frame.name : '', value: snapshotValue(value, pending) });
      return value;
    },
    threw(frame, error) {
      if (frame) frame.returned = true; // leaving by exception: no implicit-return step
      if (error && typeof error === 'object') {
        if (recordedErrors.has(error)) return;
        recordedErrors.add(error);
      }
      const described = error && typeof error === 'object' && 'message' in error ? { name: String(error.name || 'Error'), message: String(error.message) } : { name: 'Thrown value', message: format([error]) };
      snapshot(frame ? frame.line : 0, 0, frame ? frame.line : 0, 'throw', frame ? frame.current : null, { type: 'throw', error: described });
    },
    leave(frame) {
      const i = frames.lastIndexOf(frame);
      if (i !== -1) frames.splice(i, 1);
      if (frame && !frame.returned && frame.scope && frame.scope.kind === 'function') {
        snapshot(frame.endLine || frame.line, 0, frame.endLine || frame.line, 'return', frame.current, { type: 'return', name: frame.name, value: { t: 'undefined' }, implicit: true });
      }
    },
    suspend(frame, value) {
      const i = frames.lastIndexOf(frame);
      snapshot(frame ? frame.line : 0, 0, frame ? frame.line : 0, 'await', frame ? frame.current : null, { type: 'await', name: frame ? frame.name : '' });
      if (i !== -1) frames.splice(i, 1);
      return value;
    },
    resume(frame, value) {
      if (frame && !frames.includes(frame)) frames.push(frame);
      snapshot(frame ? frame.line : 0, 0, frame ? frame.line : 0, 'resume', frame ? frame.current : null, { type: 'resume', name: frame ? frame.name : '' });
      return value;
    },
    end(frame, line) {
      const i = frames.lastIndexOf(frame);
      if (i !== -1) frames.splice(i, 1);
      snapshot(line || 0, 0, line || 0, 'end', frame ? frame.current : null, { type: 'end' });
    },
    /** Called by the host when an exception escapes the program (vm) or the module evaluation (sandbox). */
    uncaught(error) {
      const described = error && typeof error === 'object' && 'message' in error ? { name: String(error.name || 'Error'), message: String(error.message) } : { name: 'Thrown value', message: format([error]) };
      fatal = described;
      const top = frames[frames.length - 1];
      if (!(error && typeof error === 'object' && recordedErrors.has(error))) {
        snapshot(top ? top.line : 0, 0, top ? top.line : 0, 'throw', top ? top.current : null, { type: 'throw', error: described, uncaught: true });
      } else if (steps.length > 0) steps[steps.length - 1].event = { ...steps[steps.length - 1].event, uncaught: true };
      frames = [];
    },
    consoleEntry(level, args) {
      if (consoleLog.length >= config.maxSteps * 2) return;
      consoleLog.push({ step: Math.max(0, steps.length - 1), level, text: format(args) });
    },
    collect() {
      return { version: 1, steps, console: consoleLog, truncated, maxSteps: config.maxSteps, error: fatal };
    },
  };

  // Console capture. The sandbox runtime (loaded after this script) wraps console again and
  // calls through to these wrappers, so run-time traces carry console output too.
  if (typeof console !== 'undefined') {
    for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
      if (typeof console[level] !== 'function') continue;
      const original = console[level].bind(console);
      console[level] = (...args) => {
        api.consoleEntry(level === 'debug' ? 'log' : level, args);
        original(...args);
      };
    }
  }

  Object.defineProperty(root, '__jsllTrace', { value: api, configurable: false, writable: false });
})();
