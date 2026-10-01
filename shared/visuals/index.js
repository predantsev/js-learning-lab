// Visual step-through specs: validation (anywhere) and compilation (Node, at content build time).
// See content/VISUALS.md for the authoring guide and app/src/visuals for the players.
import { VISUAL_KINDS } from '../content-schema.js';
import { IssueList } from './common.js';
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

/**
 * Resolve files, run the tracer / verifications, render captions to HTML.
 * ctx = { readFile(relativePath) → Promise<string>, mdInline(markdown) → html, langs: ['uk','en'] }
 * @returns {Promise<{ spec: object|null, issues: { path, message }[] }>}
 */
export async function compileVisual(kind, spec, ctx = {}) {
  const issues = new IssueList();
  if (!KINDS[kind]) { issues.add('visual', `unknown visual kind "${kind}" (one of ${VISUAL_KINDS.join(', ')})`); return { spec: null, issues: issues.list }; }
  const context = {
    readFile: ctx.readFile ?? (async (p) => { throw new Error(`no readFile in context (wanted ${p})`); }),
    mdInline: ctx.mdInline ?? defaultMdInline,
    langs: ctx.langs ?? ['uk', 'en'],
  };
  try {
    const result = await KINDS[kind].compile(spec, context, issues);
    return { spec: issues.ok ? result.spec : null, issues: issues.list };
  } catch (error) {
    issues.add('spec', `compilation failed: ${error && error.message ? error.message : String(error)}`);
    return { spec: null, issues: issues.list };
  }
}
