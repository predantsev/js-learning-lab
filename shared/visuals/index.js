// Visual step-through specs: validation (anywhere) and compilation (Node, at content build time).
// See content/VISUALS.md for the authoring guide and app/src/visuals for the players.
import { VISUAL_KINDS } from '../content-schema.js';
import { STRING_PLACEHOLDER, stringsFor } from '../exercise.js';
import { IssueList, isPlainObject } from './common.js';
import * as codeTrace from './kinds/code-trace.js';
import * as diagram from './kinds/diagram.js';
import * as eventLoop from './kinds/event-loop.js';
import * as gitGraph from './kinds/git-graph.js';
import * as memoryGraph from './kinds/memory-graph.js';
import * as pipeline from './kinds/pipeline.js';
import * as renderTimeline from './kinds/render-timeline.js';
import * as sequence from './kinds/sequence.js';

export { VISUAL_KINDS };
export { traceBabelPlugin } from './tracer.js';
export { traceToSpec } from './kinds/code-trace.js';

const KINDS = {
  'code-trace': codeTrace,
  'memory-graph': memoryGraph,
  pipeline,
  'event-loop': eventLoop,
  diagram,
  sequence,
  'git-graph': gitGraph,
  'render-timeline': renderTimeline,
};

/** JSON-schema-like descriptions of every kind's spec, for docs and tooling. */
export const VISUAL_SCHEMAS = Object.fromEntries(VISUAL_KINDS.map((kind) => [kind, KINDS[kind].schema]));

/**
 * Static checks only (no file access, no execution).
 * @returns {{ path: string, message: string }[]} empty when valid
 */
export function validateVisualSpec(kind, spec, ctx = {}) {
  void ctx;
  const issues = new IssueList();
  if (!KINDS[kind]) { issues.add('visual', `unknown visual kind "${kind}" (one of ${VISUAL_KINDS.join(', ')})`); return issues.list; }
  KINDS[kind].validate(spec, issues);
  return issues.list;
}

const defaultMdInline = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- %%key%% strings (localized example text inside a visual) ----------
const placeholders = (text) => [...String(text).matchAll(new RegExp(STRING_PLACEHOLDER.source, 'g'))].map((m) => m[1]);
/** Every string inside a JSON-like value, with `fn` applied (object keys are left alone). */
function mapStrings(value, fn) {
  if (typeof value === 'string') return fn(value);
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fn));
  if (isPlainObject(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapStrings(v, fn)]));
  return value;
}
function placeholdersIn(value, out = new Set()) {
  mapStrings(value, (s) => { for (const key of placeholders(s)) out.add(key); return s; });
  return out;
}

/** The visible step sequence of a compiled spec, to compare the language variants. */
const stepShape = (compiled) => compiled.steps.map((s) => (s.trace ? `${s.trace.line}:${s.trace.kind}` : [s.line, s.stage, s.focus].filter((x) => x !== undefined && x !== null).join(':')));

/** One spec per language when the block has strings; see compileVisual. */
async function compileLocalized(kind, spec, context, strings) {
  const issues = new IssueList();
  const variants = {};
  const found = new Map(); // "path\0message" → languages that reported it
  const read = new Set(); // raw text of the files the compiler read
  for (const lang of context.langs) {
    const table = stringsFor({ strings }, lang);
    const localize = (s) => s.replace(new RegExp(STRING_PLACEHOLDER.source, 'g'), (m, key) => (key in table ? table[key] : m));
    const langIssues = new IssueList();
    const langContext = { ...context, readFile: async (p) => { const text = await context.readFile(p); read.add(text); return localize(text); } };
    try {
      const result = await KINDS[kind].compile(mapStrings(spec, localize), langContext, langIssues);
      variants[lang] = langIssues.ok ? result.spec : null;
    } catch (error) {
      langIssues.add('spec', `compilation failed: ${error && error.message ? error.message : String(error)}`);
      variants[lang] = null;
    }
    for (const i of langIssues.list) {
      const key = `${i.path}\u0000${i.message}`;
      if (!found.has(key)) found.set(key, { ...i, langs: [] });
      found.get(key).langs.push(lang);
    }
  }
  for (const i of found.values()) issues.add(i.path, i.langs.length === context.langs.length ? i.message : `${i.message} (with the ${i.langs.join('/')} strings)`);
  const used = placeholdersIn(spec);
  for (const text of read) for (const key of placeholders(text)) used.add(key);
  for (const key of used) if (!(key in strings)) issues.add('strings', `placeholder %%${key}%% has no entry in strings`);
  if (!issues.ok) return { spec: null, issues: issues.list };
  const [first, ...others] = context.langs;
  for (const lang of others) {
    const a = stepShape(variants[first]);
    const b = stepShape(variants[lang]);
    const at = a.findIndex((s, i) => s !== b[i]);
    if (a.length !== b.length) issues.add('strings', `the ${first} and ${lang} versions have different numbers of steps (${a.length} and ${b.length}): a %%key%% value changes what the code does; both languages must show the same steps`);
    else if (at !== -1) issues.add('strings', `step ${at + 1} differs between the ${first} and ${lang} versions (${a[at] || '?'} vs ${b[at] || '?'}): a %%key%% value changes what the code does; both languages must show the same steps`);
  }
  if (!issues.ok) return { spec: null, issues: issues.list };
  // Identical variants (the placeholders did not reach the picture) need no per-language copy.
  if (others.every((lang) => JSON.stringify(variants[lang]) === JSON.stringify(variants[first]))) return { spec: variants[first], issues: issues.list };
  return { spec: { kind: variants[first].kind, byLang: variants }, issues: issues.list };
}

/**
 * Resolve files, run the tracer / verifications, render captions to HTML.
 * ctx = { readFile(relativePath) → Promise<string>, mdInline(markdown) → html, langs: ['uk','en'],
 *         strings?: { key: { uk, en } } (the block's strings table) }
 * With strings, every %%key%% in the spec and in the files it reads is resolved per language and
 * the visual is compiled once per language; when the languages differ the result is
 * { kind, byLang: { uk: spec, en: spec } } (resolve it with specForLang), otherwise the plain spec.
 * @returns {Promise<{ spec: object|null, issues: { path, message }[] }>}
 */
export async function compileVisual(kind, spec, ctx = {}) {
  const issues = new IssueList();
  if (!KINDS[kind]) { issues.add('visual', `unknown visual kind "${kind}" (one of ${VISUAL_KINDS.join(', ')})`); return { spec: null, issues: issues.list }; }
  const read = new Set();
  const baseRead = ctx.readFile ?? (async (p) => { throw new Error(`no readFile in context (wanted ${p})`); });
  const context = {
    readFile: async (p) => { const text = await baseRead(p); read.add(text); return text; },
    mdInline: ctx.mdInline ?? defaultMdInline,
    langs: ctx.langs ?? ['uk', 'en'],
  };
  if (isPlainObject(ctx.strings) && Object.keys(ctx.strings).length > 0) return compileLocalized(kind, spec, context, ctx.strings);
  try {
    const result = await KINDS[kind].compile(spec, context, issues);
    const used = placeholdersIn(spec);
    for (const text of read) for (const key of placeholders(text)) used.add(key);
    for (const key of used) issues.add('strings', `placeholder %%${key}%% has no entry in strings (add a strings table to the block)`);
    return { spec: issues.ok ? result.spec : null, issues: issues.list };
  } catch (error) {
    issues.add('spec', `compilation failed: ${error && error.message ? error.message : String(error)}`);
    return { spec: null, issues: issues.list };
  }
}

/** The spec to render in `lang` (a compiled spec with strings holds one variant per language). */
export function specForLang(spec, lang) {
  if (spec && isPlainObject(spec.byLang)) return spec.byLang[lang] ?? spec.byLang.uk ?? Object.values(spec.byLang)[0];
  return spec;
}
