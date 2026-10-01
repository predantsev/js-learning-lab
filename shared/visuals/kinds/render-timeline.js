// render-timeline: React renders as snapshots (the props/state values *that render* saw), then
// commit, then effects/cleanup, with events in between — makes "state is a snapshot" and stale
// closures visible.
import { IssueList, checkArray, checkEnum, checkText, isInt, isPlainObject, nonEmpty, renderText } from '../common.js';

export const PHASES = ['render', 'commit', 'effect', 'event', 'idle'];

export const schema = {
  kind: 'render-timeline',
  summary: 'Per render: a snapshot of props/state as that render saw them, then commit (DOM), then effects/cleanup; events between renders show what the handler closure sees and what it queues.',
  fields: {
    code: 'string — the component source shown beside the timeline (optional but recommended)',
    component: 'string — component name (default: Component)',
    steps: '[{ phase: render|commit|effect|event|idle, render: n (render number, required for render/commit/effect), caption: { uk, en }, line?: n, …phase fields }]',
    'phase: render': '{ reason: { uk, en }, snapshot: { props?: { name: value }, state?: { name: value } } } — values are JSON literals',
    'phase: commit': '{ dom: string } — what the DOM shows after this commit (e.g. button → "Clicked 1")',
    'phase: effect': '{ cleanup?: [string], run?: [string] } — cleanup from the previous render runs before the new effects',
    'phase: event': '{ name: string (e.g. click), sees: { name: value } (the closure snapshot), actions: [string] (e.g. "setCount(count + 1)"), queued?: { name: value } (what React will apply) }',
    'phase: idle': '{} — nothing happens; caption explains (e.g. a setState with the same value skips the render)',
  },
};

const jsonValue = (issues, v, path) => {
  if (v === null || ['number', 'string', 'boolean'].includes(typeof v)) return true;
  if (Array.isArray(v)) return v.every((x, i) => jsonValue(issues, x, `${path}[${i}]`));
  if (isPlainObject(v)) return Object.entries(v).every(([k, x]) => jsonValue(issues, x, `${path}.${k}`));
  issues.add(path, 'must be a JSON value');
  return false;
};
const stringList = (issues, v, path, { optional = true } = {}) => {
  if (v === undefined) { if (!optional) issues.add(path, 'missing list'); return; }
  if (!Array.isArray(v) || !v.every((s) => nonEmpty(s))) issues.add(path, 'must be a list of non-empty strings');
};

export function validate(spec, issues = new IssueList()) {
  if (!isPlainObject(spec)) { issues.add('spec', 'must be a mapping'); return issues; }
  if (spec.code !== undefined && !nonEmpty(spec.code)) issues.add('spec.code', 'must be a non-empty string when present');
  if (spec.component !== undefined && !nonEmpty(spec.component)) issues.add('spec.component', 'must be a non-empty string');
  if (!checkArray(issues, spec.steps, 'spec.steps', { min: 2 })) return issues;
  let lastRender = 0;
  const lines = nonEmpty(spec.code) ? spec.code.split('\n').length : null;
  spec.steps.forEach((s, i) => {
    const p = `spec.steps[${i}]`;
    if (!isPlainObject(s)) { issues.add(p, 'must be a mapping'); return; }
    checkText(issues, s.caption, `${p}.caption`);
    if (!checkEnum(issues, s.phase, `${p}.phase`, PHASES)) return;
    if (s.line !== undefined) {
      if (!(isInt(s.line) && s.line >= 1)) issues.add(`${p}.line`, 'must be a positive line number');
      else if (lines !== null && s.line > lines) issues.add(`${p}.line`, `the code has only ${lines} lines`);
    }
    if (['render', 'commit', 'effect'].includes(s.phase)) {
      if (!(isInt(s.render) && s.render >= 1)) issues.add(`${p}.render`, 'needs the render number (1, 2, …)');
      else if (s.phase === 'render') { if (s.render !== lastRender + 1) issues.add(`${p}.render`, `expected render ${lastRender + 1} (renders are numbered in order)`); lastRender = s.render; }
      else if (s.render !== lastRender) issues.add(`${p}.render`, `${s.phase} belongs to render ${lastRender}, the last render step`);
    }
    switch (s.phase) {
      case 'render':
        checkText(issues, s.reason, `${p}.reason`);
        if (!isPlainObject(s.snapshot)) issues.add(`${p}.snapshot`, 'needs { props?, state? } with the values this render sees');
        else {
          for (const key of ['props', 'state']) if (s.snapshot[key] !== undefined && !isPlainObject(s.snapshot[key])) issues.add(`${p}.snapshot.${key}`, 'must be a mapping of name → value');
          jsonValue(issues, s.snapshot, `${p}.snapshot`);
          if (s.snapshot.props === undefined && s.snapshot.state === undefined) issues.add(`${p}.snapshot`, 'needs at least props or state');
        }
        break;
      case 'commit':
        if (!nonEmpty(s.dom)) issues.add(`${p}.dom`, 'describe what the DOM shows after the commit');
        break;
      case 'effect':
        stringList(issues, s.cleanup, `${p}.cleanup`);
        stringList(issues, s.run, `${p}.run`);
        if ((s.cleanup ?? []).length + (s.run ?? []).length === 0) issues.add(p, 'an effect step lists "run" and/or "cleanup"');
        break;
      case 'event':
        if (!nonEmpty(s.name)) issues.add(`${p}.name`, 'needs the event name (click, submit, …)');
        if (!isPlainObject(s.sees)) issues.add(`${p}.sees`, 'needs the values the handler closure sees ({ name: value })'); else jsonValue(issues, s.sees, `${p}.sees`);
        stringList(issues, s.actions, `${p}.actions`, { optional: false });
        if (s.queued !== undefined) { if (!isPlainObject(s.queued)) issues.add(`${p}.queued`, 'must be a mapping of state name → value'); else jsonValue(issues, s.queued, `${p}.queued`); }
        break;
      default:
        break;
    }
  });
  if (!spec.steps.some((s) => isPlainObject(s) && s.phase === 'render')) issues.add('spec.steps', 'needs at least one render step');
  return issues;
}

export async function compile(spec, ctx, issues = new IssueList()) {
  validate(spec, issues);
  if (!issues.ok) return { spec: null, issues };
  let current = null; // latest render snapshot
  let dom = null;
  const renders = [];
  const steps = spec.steps.map((s) => {
    const base = { caption: renderText(ctx, s.caption), phase: s.phase, render: s.render ?? (current ? current.n : 0), line: s.line ?? null };
    if (s.phase === 'render') {
      current = { n: s.render, props: s.snapshot.props ?? {}, state: s.snapshot.state ?? {} };
      renders.push(s.render);
      return { ...base, reason: renderText(ctx, s.reason), snapshot: { props: current.props, state: current.state }, dom };
    }
    if (s.phase === 'commit') { dom = s.dom; return { ...base, snapshot: current ? { props: current.props, state: current.state } : null, dom }; }
    if (s.phase === 'effect') return { ...base, snapshot: current ? { props: current.props, state: current.state } : null, dom, cleanup: s.cleanup ?? [], run: s.run ?? [] };
    if (s.phase === 'event') return { ...base, snapshot: current ? { props: current.props, state: current.state } : null, dom, event: { name: s.name, sees: s.sees, actions: s.actions, queued: s.queued ?? null } };
    return { ...base, snapshot: current ? { props: current.props, state: current.state } : null, dom };
  });
  return { spec: { kind: 'render-timeline', code: spec.code ?? null, language: 'jsx', component: spec.component ?? 'Component', renders, steps }, issues };
}
