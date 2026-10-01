#!/usr/bin/env node
// Compiles the sample visual blocks (content/_samples/visuals/*.yaml) to JSON for the demo page
// (app/visuals-demo.html) and tests, or prints the generated steps of one traced file.
//
//   node scripts/content/compile-visual-samples.mjs                 → dist/content/visuals/samples.json
//   node scripts/content/compile-visual-samples.mjs --out <file>    → custom output path
//   node scripts/content/compile-visual-samples.mjs --trace file.js → table of generated steps (authoring aid)
//   node scripts/content/compile-visual-samples.mjs --check         → validate + compile only, no output file
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import YAML from 'yaml';
import { compileVisual, validateVisualSpec } from '../../shared/visuals/index.js';
import { traceSource } from '../../shared/visuals/tracer.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SAMPLES_DIR = path.join(ROOT, 'content', '_samples', 'visuals');
const DEFAULT_OUT = path.join(ROOT, 'dist', 'content', 'visuals', 'samples.json');

export const mdInline = (markdown) => String(marked.parseInline(String(markdown), { gfm: true, breaks: false })).trim();

export function contextFor(dir) {
  return {
    readFile: async (relative) => {
      const target = path.resolve(dir, relative);
      if (!target.startsWith(path.resolve(dir) + path.sep) && target !== path.resolve(dir)) throw new Error(`"${relative}" points outside the lesson directory`);
      return fs.readFile(target, 'utf8');
    },
    mdInline,
    langs: ['uk', 'en'],
  };
}

/** Compile every sample block. Returns { samples: [...], failures: [...] }. */
export async function compileSamples(dir = SAMPLES_DIR) {
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.yaml')).sort();
  const samples = [];
  const failures = [];
  const ctx = contextFor(dir);
  for (const file of files) {
    const block = YAML.parse(await fs.readFile(path.join(dir, file), 'utf8'));
    const staticIssues = validateVisualSpec(block.visual, block.spec);
    if (staticIssues.length > 0) { failures.push({ file, issues: staticIssues }); continue; }
    const { spec, issues } = await compileVisual(block.visual, block.spec, ctx);
    if (issues.length > 0) { failures.push({ file, issues }); continue; }
    samples.push({ file, id: block.id, visual: block.visual, title: block.title, textEquivalent: block.textEquivalent, spec });
  }
  return { samples, failures };
}

const printIssues = (file, issues) => {
  console.error(`✗ ${file}`);
  for (const issue of issues) console.error(`    ${issue.path}: ${issue.message}`);
};

async function printTrace(file) {
  const source = await fs.readFile(file, 'utf8');
  const { trace, error } = await traceSource(source, { file: path.basename(file) });
  if (!trace) { console.error(`cannot trace: ${error.message}`); process.exitCode = 1; return; }
  const lines = source.split('\n');
  console.log(`step  line  kind     hit  frame            event / variables`);
  const hits = new Map();
  for (const s of trace.steps) {
    const hit = (hits.get(s.line) ?? 0) + 1;
    hits.set(s.line, hit);
    const frame = s.frames[s.frames.length - 1]?.name ?? '';
    const vars = [];
    let id = s.scope;
    while (id && s.scopes[id]) { const sc = s.scopes[id]; for (const v of sc.vars) if (!vars.some((x) => x.startsWith(`${v.name}=`))) vars.push(`${v.name}=${v.uninit ? '⟨uninitialized⟩' : v.value.t === 'ref' ? `#${v.value.id}` : v.value.t === 'string' ? JSON.stringify(v.value.v) : String(v.value.v)}`); id = sc.parent; }
    const event = s.event ? (s.event.type === 'call' ? `call ${s.event.name}(${s.event.args.map((a) => a.name).join(', ')})` : s.event.type === 'return' ? `return ${s.event.value.t === 'ref' ? `#${s.event.value.id}` : s.event.value.v ?? s.event.value.t}` : s.event.type === 'throw' ? `throw ${s.event.error.name}: ${s.event.error.message}` : s.event.type) : '';
    console.log(`${String(s.i + 1).padStart(4)}  ${String(s.line).padStart(4)}  ${s.kind.padEnd(7)}  ${String(hit).padStart(3)}  ${frame.padEnd(16).slice(0, 16)} ${event ? `${event}  ` : ''}${vars.join(' ')}`);
    if (s.kind === 'stmt' || s.kind === 'cond' || s.kind === 'iter') console.log(`${' '.repeat(40)}│ ${lines[s.line - 1]?.trim() ?? ''}`);
  }
  console.log(`\n${trace.steps.length} steps${trace.truncated ? ' (truncated)' : ''}; console: ${trace.console.map((c) => JSON.stringify(c.text)).join(', ') || '(nothing)'}${trace.error ? `; uncaught ${trace.error.name}: ${trace.error.message}` : ''}`);
}

async function main() {
  const args = process.argv.slice(2);
  const traceIndex = args.indexOf('--trace');
  if (traceIndex !== -1) return printTrace(path.resolve(args[traceIndex + 1]));
  const outIndex = args.indexOf('--out');
  const out = outIndex !== -1 ? path.resolve(args[outIndex + 1]) : DEFAULT_OUT;
  const { samples, failures } = await compileSamples();
  for (const f of failures) printIssues(f.file, f.issues);
  for (const s of samples) console.log(`✓ ${s.file} (${s.visual}, ${s.spec.steps.length} steps)`);
  if (failures.length > 0) { process.exitCode = 1; return; }
  if (args.includes('--check')) return undefined;
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, JSON.stringify({ generatedAt: new Date().toISOString(), samples }, null, 0));
  console.log(`→ ${path.relative(ROOT, out)} (${samples.length} samples)`);
  return undefined;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
