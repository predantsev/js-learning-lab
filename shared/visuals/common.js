// Helpers shared by the visual kinds: issue collection, bilingual text checks, caption binding
// and the value format used by code-trace / memory-graph (same shape as sandbox/trace-runtime.js).
import { LANGS } from '../content-schema.js';

export const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;
export const isInt = (v) => Number.isInteger(v);

export class IssueList {
  constructor() { this.list = []; }
  add(path, message) { this.list.push({ path, message }); }
  get ok() { return this.list.length === 0; }
}

/** Bilingual text: { uk, en } with non-empty strings. */
export function checkText(issues, value, path, { optional = false } = {}) {
  if (value === undefined || value === null) {
    if (!optional) issues.add(path, 'missing bilingual text (needs uk and en)');
    return false;
  }
  if (!isPlainObject(value)) {
    issues.add(path, 'must be an object with "uk" and "en"');
    return false;
  }
  let ok = true;
  for (const lang of LANGS) {
    if (!nonEmpty(value[lang])) { issues.add(`${path}.${lang}`, 'missing or empty translation'); ok = false; }
  }
  for (const key of Object.keys(value)) if (!LANGS.includes(key)) issues.add(`${path}.${key}`, 'unknown language key');
  return ok;
}

/** A label may be bilingual or a plain string (code, identifiers) used for both languages. */
export function checkLabel(issues, value, path, { optional = false } = {}) {
  if (typeof value === 'string') {
    if (!nonEmpty(value)) issues.add(path, 'empty label');
    return nonEmpty(value);
  }
  return checkText(issues, value, path, { optional });
}
export const toText = (value) => (typeof value === 'string' ? { uk: value, en: value } : value);

export function checkArray(issues, value, path, { min = 0 } = {}) {
  if (!Array.isArray(value)) { issues.add(path, `must be a list${min > 0 ? ` with at least ${min} item${min === 1 ? '' : 's'}` : ''}`); return false; }
  if (value.length < min) { issues.add(path, `needs at least ${min} item${min === 1 ? '' : 's'}`); return false; }
  return true;
}

export function checkEnum(issues, value, path, allowed, { optional = false } = {}) {
  if (value === undefined && optional) return true;
  if (!allowed.includes(value)) { issues.add(path, `must be one of ${allowed.join(', ')}`); return false; }
  return true;
}

export function checkId(issues, value, path) {
  if (!nonEmpty(value) || !/^[A-Za-z_][\w-]*$/.test(value)) { issues.add(path, 'needs an id (letters, digits, "-", "_")'); return false; }
  return true;
}

/** Convert bilingual Markdown to bilingual HTML through the compiler-provided mdInline. */
export function renderText(ctx, value) {
  const text = toText(value);
  const out = {};
  for (const lang of ctx.langs ?? LANGS) out[lang] = ctx.mdInline(String(text[lang] ?? ''));
  return out;
}

/**
 * Simple placeholder substitution: "{item}" → values.item (pipeline captions). A value may be
 * bilingual ({ uk, en }, e.g. an item label from a bilingual `show`): each language takes its own.
 */
export function fillPlaceholders(text, values) {
  const out = {};
  for (const [lang, s] of Object.entries(toText(text))) {
    out[lang] = String(s).replace(/\{(\w+)\}/g, (m, key) => {
      if (!(key in values)) return m;
      const value = values[key];
      return String(isPlainObject(value) ? value[lang] ?? Object.values(value)[0] : value);
    });
  }
  return out;
}

// ---------- caption binding for generated steps (code-trace, memory-graph from trace) ----------

/**
 * Validate `captions: [{ at: { line, hit? } | { step }, text }]`.
 * hit: 1-based occurrence of that line among the generated steps, or "every".
 */
export function checkCaptions(issues, captions, path) {
  if (!checkArray(issues, captions, path, { min: 1 })) return;
  captions.forEach((c, i) => {
    const p = `${path}[${i}]`;
    if (!isPlainObject(c)) { issues.add(p, 'must be a mapping with "at" and "text"'); return; }
    checkText(issues, c.text, `${p}.text`);
    const at = c.at;
    if (!isPlainObject(at)) { issues.add(`${p}.at`, 'needs { line, hit? } or { step }'); return; }
    if (at.step !== undefined) {
      if (!isInt(at.step) || at.step < 1) issues.add(`${p}.at.step`, 'must be a positive step number (1-based)');
      if (at.line !== undefined) issues.add(`${p}.at`, 'use either "line" or "step", not both');
      return;
    }
    if (!isInt(at.line) || at.line < 1) issues.add(`${p}.at.line`, 'must be a positive line number');
    if (at.hit !== undefined && at.hit !== 'every' && !(isInt(at.hit) && at.hit >= 1)) issues.add(`${p}.at.hit`, 'must be a positive number or "every"');
    if (at.kind !== undefined && typeof at.kind !== 'string') issues.add(`${p}.at.kind`, 'must be a step kind name');
  });
}

/**
 * Bind captions to generated steps. Returns { byStep: Map<stepIndex, captionIndex>, issues }.
 * steps: array with .line and .kind. Reports captions that match nothing and ambiguous hits.
 */
export function bindCaptions(issues, captions, steps, path) {
  const byStep = new Map();
  const hitsByLine = new Map();
  steps.forEach((s, i) => {
    const key = s.line;
    if (!hitsByLine.has(key)) hitsByLine.set(key, []);
    hitsByLine.get(key).push(i);
  });
  captions.forEach((c, ci) => {
    const p = `${path}[${ci}].at`;
    const at = c.at;
    if (at.step !== undefined) {
      if (at.step > steps.length) { issues.add(p, `step ${at.step} does not exist (the trace has ${steps.length} steps)`); return; }
      byStep.set(at.step - 1, ci);
      return;
    }
    let hits = hitsByLine.get(at.line) ?? [];
    if (at.kind) hits = hits.filter((i) => steps[i].kind === at.kind);
    if (hits.length === 0) {
      const lines = [...hitsByLine.keys()].sort((a, b) => a - b);
      issues.add(p, `no step runs line ${at.line}${at.kind ? ` with kind "${at.kind}"` : ''}; lines with steps: ${lines.join(', ')}`);
      return;
    }
    if (at.hit === 'every') { for (const i of hits) if (!byStep.has(i)) byStep.set(i, ci); return; }
    const hit = at.hit ?? 1;
    if (hit > hits.length) { issues.add(p, `line ${at.line} runs ${hits.length} time${hits.length === 1 ? '' : 's'}, hit ${hit} does not exist`); return; }
    const i = hits[hit - 1];
    if (byStep.has(i)) issues.add(p, `step ${i + 1} (line ${at.line}, hit ${hit}) already has caption ${byStep.get(i) + 1}`);
    byStep.set(i, ci);
  });
  return byStep;
}

// ---------- authored values → trace value format ----------

/**
 * Convert an authored value (YAML literal, { ref: id } or { fn: name }) to the trace format.
 * Primitives map by type; objects/arrays inline in YAML are an error (they must live in `heap` with an id,
 * because identity is the whole point of a memory graph). `{ empty: true }` is a hole of a sparse
 * array (an index that was never assigned: `[1, , 3]`), so it is accepted only among array items.
 */
export function authoredValue(issues, value, path, { inArray = false } = {}) {
  if (value === null) return { t: 'null' };
  if (value === undefined) return { t: 'undefined' };
  if (typeof value === 'number') return Number.isFinite(value) ? { t: 'number', v: value } : { t: 'number', v: String(value) };
  if (typeof value === 'boolean') return { t: 'boolean', v: value };
  if (typeof value === 'string') {
    if (value === 'undefined') return { t: 'undefined' };
    if (value === 'uninitialized') return { t: 'uninit' };
    return { t: 'string', v: value };
  }
  if (isPlainObject(value)) {
    if (typeof value.ref === 'string') return { t: 'ref', id: value.ref };
    if (typeof value.number === 'number') return { t: 'number', v: value.number };
    if (typeof value.string === 'string') return { t: 'string', v: value.string };
    if (value.empty === true && Object.keys(value).length === 1) {
      if (inArray) return { t: 'empty' };
      issues.add(path, 'an empty slot ({ empty: true }) exists only among the items of an array (a hole of a sparse array)');
      return { t: 'opaque' };
    }
    issues.add(path, 'inline objects are not allowed here: put the object in "heap" with an id and reference it with { ref: id }');
    return { t: 'opaque' };
  }
  if (Array.isArray(value)) {
    issues.add(path, 'inline arrays are not allowed here: put the array in "heap" with an id and reference it with { ref: id }');
    return { t: 'opaque' };
  }
  issues.add(path, 'unsupported value');
  return { t: 'opaque' };
}

/** Convert an authored heap entry { kind: object|array|function|class|map|set, ... } to the trace heap format. */
export function authoredHeapEntry(issues, entry, path, heapIds) {
  if (!isPlainObject(entry)) { issues.add(path, 'must be a mapping with "kind"'); return { t: 'opaque' }; }
  const kind = entry.kind ?? (Array.isArray(entry.items) ? 'array' : 'object');
  const val = (v, p, options) => {
    const out = authoredValue(issues, v, p, options);
    if (out.t === 'ref' && !heapIds.has(out.id)) issues.add(p, `unknown heap id "${out.id}"`);
    return out;
  };
  switch (kind) {
    case 'object': {
      const props = isPlainObject(entry.props) ? Object.entries(entry.props).map(([k, v]) => [k, val(v, `${path}.props.${k}`)]) : [];
      if (!isPlainObject(entry.props)) issues.add(`${path}.props`, 'an object needs "props" (a mapping of property → value)');
      return { t: 'object', ctor: entry.ctor ?? null, props, more: 0 };
    }
    case 'array': {
      if (!Array.isArray(entry.items)) { issues.add(`${path}.items`, 'an array needs "items" (a list of values)'); return { t: 'array', length: 0, items: [], more: 0 }; }
      return { t: 'array', length: entry.items.length, items: entry.items.map((v, i) => val(v, `${path}.items[${i}]`, { inArray: true })), more: 0 };
    }
    case 'function':
    case 'class':
      return { t: kind, name: String(entry.name ?? ''), arrow: entry.arrow === true, scope: entry.scope ?? null };
    case 'map':
      return { t: 'map', size: Array.isArray(entry.entries) ? entry.entries.length : 0, entries: (entry.entries ?? []).map(([k, v], i) => [val(k, `${path}.entries[${i}][0]`), val(v, `${path}.entries[${i}][1]`)]) };
    case 'set':
      return { t: 'set', size: Array.isArray(entry.items) ? entry.items.length : 0, items: (entry.items ?? []).map((v, i) => val(v, `${path}.items[${i}]`)) };
    default:
      issues.add(`${path}.kind`, 'must be one of object, array, function, class, map, set');
      return { t: 'opaque' };
  }
}
