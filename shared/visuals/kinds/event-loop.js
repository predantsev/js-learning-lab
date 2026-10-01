// event-loop: call stack, microtask queue, task queue, Web APIs and console; one move per step.
// The author writes the step sequence; the compiler runs the code (node:vm, virtual timers) and
// refuses the block when the console order claimed by the steps differs from the real output.
import { IssueList, checkArray, checkText, isInt, isPlainObject, nonEmpty, renderText } from '../common.js';
import { loadExec } from '../exec.js';

export const schema = {
  kind: 'event-loop',
  summary: 'Call stack, microtask queue, (macro)task queue, optional Web API area and console; each step moves exactly one thing and says why. The claimed console order is verified by running the code.',
  fields: {
    file: 'string — JavaScript file relative to the lesson directory (or "code")',
    code: 'string — inline JavaScript source',
    steps: '[{ caption: { uk, en }, line?: n, stack: [string], microtasks?: [string], tasks?: [string], webApis?: [string], log?: string | [string] }] — queues list their items bottom→top / front→back; "log" is the console output produced during this step',
    'console text': 'console.log arguments are joined with one space; strings raw, numbers as written, objects like { a: 1 }, arrays like [1, 2]',
  },
};

const stringList = (issues, value, path) => {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((s) => typeof s === 'string')) { issues.add(path, 'must be a list of short strings'); return []; }
  return value;
};

export function validate(spec, issues = new IssueList()) {
  if (!isPlainObject(spec)) { issues.add('spec', 'must be a mapping'); return issues; }
  if (!nonEmpty(spec.file) && !nonEmpty(spec.code)) issues.add('spec.file', 'needs "file" or inline "code"');
  if (nonEmpty(spec.file) && nonEmpty(spec.code)) issues.add('spec', 'use either "file" or "code", not both');
  if (!checkArray(issues, spec.steps, 'spec.steps', { min: 2 })) return issues;
  spec.steps.forEach((step, i) => {
    const p = `spec.steps[${i}]`;
    if (!isPlainObject(step)) { issues.add(p, 'must be a mapping'); return; }
    checkText(issues, step.caption, `${p}.caption`);
    if (step.line !== undefined && !(isInt(step.line) && step.line >= 1)) issues.add(`${p}.line`, 'must be a positive line number');
    if (step.stack === undefined) issues.add(`${p}.stack`, 'list the call stack (use [] when it is empty)');
    stringList(issues, step.stack, `${p}.stack`);
    stringList(issues, step.microtasks, `${p}.microtasks`);
    stringList(issues, step.tasks, `${p}.tasks`);
    stringList(issues, step.webApis, `${p}.webApis`);
    if (step.log !== undefined && typeof step.log !== 'string' && !(Array.isArray(step.log) && step.log.every((s) => typeof s === 'string'))) issues.add(`${p}.log`, 'must be a string or a list of strings');
  });
  return issues;
}

export const claimedOutput = (steps) => steps.flatMap((s) => (s.log === undefined ? [] : Array.isArray(s.log) ? s.log : [s.log]));

export async function compile(spec, ctx, issues = new IssueList()) {
  validate(spec, issues);
  if (!issues.ok) return { spec: null, issues };
  let source;
  const file = nonEmpty(spec.file) ? spec.file : 'example.js';
  try {
    source = nonEmpty(spec.code) ? spec.code : await ctx.readFile(spec.file);
  } catch (error) {
    issues.add('spec.file', `cannot read "${spec.file}": ${error.message}`);
    return { spec: null, issues };
  }
  const { runScript } = await loadExec();
  const result = await runScript(source, { file: file.split('/').pop() });
  if (result.error && result.error.phase === 'compile') {
    issues.add('spec.file', `syntax error in ${file}${result.error.line ? ` at line ${result.error.line}` : ''}: ${result.error.message}`);
    return { spec: null, issues };
  }
  const actual = result.output.map((o) => o.text);
  const claimed = claimedOutput(spec.steps);
  if (JSON.stringify(actual) !== JSON.stringify(claimed)) {
    const firstDiff = actual.findIndex((line, i) => claimed[i] !== line);
    const at = firstDiff === -1 ? Math.min(actual.length, claimed.length) : firstDiff;
    issues.add('spec.steps', `the console order claimed by the steps does not match the real output.\n  claimed: ${JSON.stringify(claimed)}\n  actual:  ${JSON.stringify(actual)}\n  first difference at output line ${at + 1}: claimed ${JSON.stringify(claimed[at] ?? '(nothing)')}, actual ${JSON.stringify(actual[at] ?? '(nothing)')}`);
  }
  if (result.error) issues.add('spec.file', `the program throws ${result.error.name}: ${result.error.message}; event-loop examples must run to completion`);
  if (result.overflow) issues.add('spec.file', 'the program schedules too many timers for a step-through (limit 200 callbacks)');
  const lines = source.split('\n').length;
  let logged = 0;
  const steps = spec.steps.map((step, i) => {
    if (step.line !== undefined && step.line > lines) issues.add(`spec.steps[${i}].line`, `the code has only ${lines} lines`);
    const log = step.log === undefined ? [] : Array.isArray(step.log) ? step.log : [step.log];
    logged += log.length;
    return {
      caption: renderText(ctx, step.caption),
      line: step.line ?? null,
      stack: step.stack ?? [],
      microtasks: step.microtasks ?? [],
      tasks: step.tasks ?? [],
      webApis: step.webApis ?? [],
      logged,
    };
  });
  const last = spec.steps[spec.steps.length - 1];
  if (last && (last.stack.length > 0 || (last.microtasks ?? []).length > 0 || (last.tasks ?? []).length > 0)) issues.add(`spec.steps[${spec.steps.length - 1}]`, 'the last step should show an empty stack and empty queues (the program is finished)');
  return { spec: { kind: 'event-loop', file, code: source, language: 'js', console: actual.map((text, i) => ({ level: result.output[i].level, text })), verified: issues.ok, steps }, issues };
}
