// memory-graph: bindings → values / heap objects with reference arrows. Authored states, or
// derived from a real execution trace (`from: trace`).
import { IssueList, authoredHeapEntry, authoredValue, checkArray, checkEnum, checkId, checkText, isInt, isPlainObject, nonEmpty, renderText } from '../common.js';
import * as codeTrace from './code-trace.js';

export const schema = {
  kind: 'memory-graph',
  summary: 'Variables (bindings) pointing at values and heap objects; identity vs copy, shallow vs deep copy, mutation through a shared reference.',
  fields: {
    from: '"trace" — derive the states from a real execution instead of authoring them (then use the code-trace fields: file/code, captions, steps)',
    code: 'string — optional code shown above the graph; a state may highlight one of its lines',
    states: '[{ caption: { uk, en }, line?: n, bindings: [{ name, kind?: let|const|var|param, value }], heap: { id: { kind: object|array|function|class|map|set, props|items|name } }, changed?: [names or heap ids] }]',
    'value syntax': 'a YAML literal (5, "text", true, null), "undefined", "uninitialized", or { ref: heapId }; objects and arrays always live in heap so identity is explicit',
  },
};

export function validate(spec, issues = new IssueList()) {
  if (!isPlainObject(spec)) { issues.add('spec', 'must be a mapping'); return issues; }
  if (spec.from === 'trace') return codeTrace.validate(spec, issues);
  if (spec.from !== undefined) { issues.add('spec.from', 'the only supported value is "trace"'); return issues; }
  if (spec.code !== undefined && !nonEmpty(spec.code)) issues.add('spec.code', 'must be a non-empty string when present');
  if (!checkArray(issues, spec.states, 'spec.states', { min: 1 })) return issues;
  spec.states.forEach((state, i) => {
    const p = `spec.states[${i}]`;
    if (!isPlainObject(state)) { issues.add(p, 'must be a mapping'); return; }
    checkText(issues, state.caption, `${p}.caption`);
    if (state.line !== undefined && !(isInt(state.line) && state.line >= 1)) issues.add(`${p}.line`, 'must be a positive line number');
    if (state.line !== undefined && nonEmpty(spec.code) && state.line > spec.code.split('\n').length) issues.add(`${p}.line`, `code has only ${spec.code.split('\n').length} lines`);
    const heapIds = new Set(Object.keys(isPlainObject(state.heap) ? state.heap : {}));
    if (state.heap !== undefined && !isPlainObject(state.heap)) issues.add(`${p}.heap`, 'must be a mapping of id → { kind, … }');
    for (const id of heapIds) checkId(issues, id, `${p}.heap.${id}`);
    for (const [id, entry] of Object.entries(isPlainObject(state.heap) ? state.heap : {})) authoredHeapEntry(issues, entry, `${p}.heap.${id}`, heapIds);
    if (!checkArray(issues, state.bindings, `${p}.bindings`, { min: 1 })) return;
    const names = new Set();
    state.bindings.forEach((b, j) => {
      const bp = `${p}.bindings[${j}]`;
      if (!isPlainObject(b)) { issues.add(bp, 'must be { name, value }'); return; }
      if (!nonEmpty(b.name)) issues.add(`${bp}.name`, 'missing name');
      if (names.has(b.name)) issues.add(`${bp}.name`, `duplicate binding "${b.name}"`);
      names.add(b.name);
      checkEnum(issues, b.kind, `${bp}.kind`, ['let', 'const', 'var', 'param', 'function', 'class', 'import'], { optional: true });
      if (!('value' in b)) issues.add(`${bp}.value`, 'missing value (use "undefined" or "uninitialized" explicitly)');
      else {
        const v = authoredValue(issues, b.value, `${bp}.value`);
        if (v.t === 'ref' && !heapIds.has(v.id)) issues.add(`${bp}.value`, `unknown heap id "${v.id}"`);
      }
    });
    if (state.changed !== undefined) {
      if (!Array.isArray(state.changed)) issues.add(`${p}.changed`, 'must be a list of binding names or heap ids');
      else for (const c of state.changed) if (!names.has(c) && !heapIds.has(c)) issues.add(`${p}.changed`, `"${c}" is neither a binding nor a heap id in this state`);
    }
  });
  return issues;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export async function compile(spec, ctx, issues = new IssueList()) {
  if (isPlainObject(spec) && spec.from === 'trace') return compileFromTrace(spec, ctx, issues);
  validate(spec, issues);
  if (!issues.ok) return { spec: null, issues };
  let previous = null;
  const steps = spec.states.map((state, i) => {
    const heapIds = new Set(Object.keys(state.heap ?? {}));
    const heap = {};
    for (const [id, entry] of Object.entries(state.heap ?? {})) heap[id] = authoredHeapEntry(issues, entry, `spec.states[${i}].heap.${id}`, heapIds);
    const bindings = state.bindings.map((b) => ({ name: b.name, kind: b.kind ?? 'let', scope: b.scope ?? null, value: authoredValue(issues, b.value, '') }));
    let changed = state.changed;
    if (!changed) {
      changed = [];
      if (previous) {
        for (const b of bindings) { const old = previous.bindings.find((x) => x.name === b.name); if (!old || !same(old.value, b.value)) changed.push(b.name); }
        for (const [id, entry] of Object.entries(heap)) if (!previous.heap[id] || !same(previous.heap[id], entry)) changed.push(id);
      }
    }
    const step = { caption: renderText(ctx, state.caption), line: state.line ?? null, bindings, heap, changed };
    previous = step;
    return step;
  });
  return { spec: { kind: 'memory-graph', code: spec.code ?? null, language: 'js', steps }, issues };
}

/** Flatten the scope chain of the active frame into one binding list (innermost scope first). */
function bindingsOf(raw) {
  const out = [];
  let id = raw.scope;
  const seen = new Set();
  while (id && raw.scopes[id] && !seen.has(id)) {
    seen.add(id);
    const scope = raw.scopes[id];
    for (const v of scope.vars) {
      if (out.some((b) => b.name === v.name)) continue; // shadowed by an inner scope
      out.push({ name: v.name, kind: v.kind, scope: scope.kind === 'module' ? 'module' : scope.name || scope.kind, value: v.uninit ? { t: 'uninit' } : v.value });
    }
    id = scope.parent;
  }
  return out;
}

async function compileFromTrace(spec, ctx, issues) {
  const compiled = await codeTrace.compile(spec, ctx, issues);
  if (!compiled.spec) return { spec: null, issues };
  let previous = null;
  const steps = compiled.spec.steps.map((s) => {
    const bindings = bindingsOf(s.trace);
    const heap = s.trace.heap;
    const changed = [];
    if (previous) {
      for (const b of bindings) { const old = previous.bindings.find((x) => x.name === b.name); if (!old || !same(old.value, b.value)) changed.push(b.name); }
      for (const [id, entry] of Object.entries(heap)) if (!previous.heap[id] || !same(previous.heap[id], entry)) changed.push(id);
    }
    const step = { caption: s.caption, line: s.trace.line, bindings, heap, changed };
    previous = step;
    return step;
  });
  return { spec: { kind: 'memory-graph', code: compiled.spec.code, language: 'js', steps }, issues };
}
