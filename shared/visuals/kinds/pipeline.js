// pipeline: a collection flowing through array stages (filter, map, reduce, sort, find, flatMap).
// The author writes the input data and the stage functions as code; the compiler *executes* them
// (node:vm) so the per-item results shown to the learner are real.
import { IssueList, checkArray, checkEnum, checkText, fillPlaceholders, isPlainObject, nonEmpty, renderText } from '../common.js';
import { loadExec } from '../exec.js';

export const OPS = ['filter', 'map', 'reduce', 'sort', 'find', 'flatMap'];

export const schema = {
  kind: 'pipeline',
  summary: 'Items flow through filter / map / reduce / sort / find / flatMap stages; each stage shows its function and what happened to every item. Results are computed by running the functions.',
  fields: {
    code: 'string — optional code shown above the pipeline (usually the chained expression)',
    input: '{ label: { uk, en }, items: [JSON values], show?: "item => string" (label function), caption: { uk, en } }',
    stages: '[{ op: filter|map|reduce|sort|find|flatMap, fn: "JavaScript function source", initial?: JSON (reduce), label?: string (short display of fn), show?: "value => string", caption: { uk, en }, perItem?: boolean, summary?: { uk, en } (required with perItem) }]',
    result: '{ label?: { uk, en } } — optional label under the final output; "{count}" is replaced by the number of items',
    'caption placeholders (perItem)': '{item} {result} {index} {count} {acc}',
  },
};

const isFnSource = (s) => nonEmpty(s) && /=>|^\s*(async\s+)?function\b/.test(s);

export function validate(spec, issues = new IssueList()) {
  if (!isPlainObject(spec)) { issues.add('spec', 'must be a mapping'); return issues; }
  if (spec.code !== undefined && !nonEmpty(spec.code)) issues.add('spec.code', 'must be a non-empty string when present');
  if (!isPlainObject(spec.input)) issues.add('spec.input', 'needs { label, items, caption }');
  else {
    checkText(issues, spec.input.label, 'spec.input.label');
    checkText(issues, spec.input.caption, 'spec.input.caption');
    checkArray(issues, spec.input.items, 'spec.input.items', { min: 1 });
    if (spec.input.show !== undefined && !isFnSource(spec.input.show)) issues.add('spec.input.show', 'must be a function source such as "item => item.name"');
  }
  if (checkArray(issues, spec.stages, 'spec.stages', { min: 1 })) {
    spec.stages.forEach((stage, i) => {
      const p = `spec.stages[${i}]`;
      if (!isPlainObject(stage)) { issues.add(p, 'must be a mapping'); return; }
      checkEnum(issues, stage.op, `${p}.op`, OPS);
      if (!isFnSource(stage.fn)) issues.add(`${p}.fn`, 'must be a function source such as "item => item.price <= 100"');
      checkText(issues, stage.caption, `${p}.caption`);
      if (stage.perItem === true) {
        checkText(issues, stage.summary, `${p}.summary`);
        if (stage.op === 'sort') issues.add(`${p}.perItem`, 'sort cannot be shown per item (a comparison is not one item)');
      }
      if (stage.op === 'reduce' && !('initial' in stage)) issues.add(`${p}.initial`, 'reduce needs an "initial" value');
      if (stage.show !== undefined && !isFnSource(stage.show)) issues.add(`${p}.show`, 'must be a function source');
      if (stage.label !== undefined && !nonEmpty(stage.label)) issues.add(`${p}.label`, 'must be a non-empty string');
    });
  }
  if (spec.result !== undefined) {
    if (!isPlainObject(spec.result)) issues.add('spec.result', 'must be a mapping');
    else if (spec.result.label !== undefined) checkText(issues, spec.result.label, 'spec.result.label');
  }
  return issues;
}

const defaultShow = (v) => {
  if (typeof v === 'string') return v;
  if (v === null || v === undefined || typeof v !== 'object') return String(v);
  if (Array.isArray(v)) return `[${v.map(defaultShow).join(', ')}]`;
  return `{ ${Object.entries(v).map(([k, x]) => `${k}: ${defaultShow(x)}`).join(', ')} }`;
};

export async function compile(spec, ctx, issues = new IssueList()) {
  validate(spec, issues);
  if (!issues.ok) return { spec: null, issues };
  const { createRunContext } = await loadExec();
  const run = await createRunContext();
  const evalFn = (source, path) => {
    try {
      const fn = run.evalIn(`(${source})`, path);
      if (typeof fn !== 'function') { issues.add(path, 'must evaluate to a function'); return null; }
      return fn;
    } catch (error) {
      issues.add(path, `cannot evaluate: ${error.message}`);
      return null;
    }
  };
  const safeShow = (fn, value, path) => {
    if (!fn) return defaultShow(value);
    try { return String(fn(value)); } catch (error) { issues.add(path, `show function failed: ${error.message}`); return defaultShow(value); }
  };
  const inputShow = spec.input.show ? evalFn(spec.input.show, 'spec.input.show') : null;
  let seq = 0;
  const mkItem = (value, showFn, path) => ({ id: `i${(seq += 1)}`, value, label: safeShow(showFn, value, path) });
  let current = spec.input.items.map((v) => mkItem(v, inputShow, 'spec.input.show'));
  const steps = [];
  const stagesOut = [];
  steps.push({ caption: renderText(ctx, spec.input.caption), stage: -1, items: current.map((it) => ({ id: it.id, label: it.label, status: 'in' })), output: null });

  for (const [si, stage] of spec.stages.entries()) {
    const p = `spec.stages[${si}]`;
    const fn = evalFn(stage.fn, `${p}.fn`);
    // map/flatMap/reduce produce new values: without a stage "show" they are formatted generically.
    const show = stage.show ? evalFn(stage.show, `${p}.show`) : null;
    if (!fn) break;
    const fnLabel = stage.label ?? stage.fn.trim();
    stagesOut.push({ op: stage.op, fn: fnLabel, source: stage.fn.trim() });
    const perItemSteps = [];
    const before = current;
    let after = [];
    let value = null; // for reduce/find
    let outputKind = 'list';
    const statusOf = new Map();
    try {
      if (stage.op === 'filter' || stage.op === 'map' || stage.op === 'flatMap' || stage.op === 'find') {
        let found = false;
        before.forEach((it, index) => {
          if (stage.op === 'find' && found) { statusOf.set(it.id, 'skipped'); return; }
          const r = fn(it.value, index, before.map((x) => x.value));
          let result;
          if (stage.op === 'filter') { const keep = Boolean(r); statusOf.set(it.id, keep ? 'kept' : 'dropped'); if (keep) after.push({ ...it }); result = keep; }
          else if (stage.op === 'map') { const out = mkItem(r, show, `${p}.show`); out.from = it.id; after.push(out); statusOf.set(it.id, 'mapped'); result = out.label; }
          else if (stage.op === 'flatMap') { const list = Array.isArray(r) ? r : [r]; for (const v of list) { const out = mkItem(v, show, `${p}.show`); out.from = it.id; after.push(out); } statusOf.set(it.id, 'mapped'); result = `[${list.map((v) => safeShow(show, v, `${p}.show`)).join(', ')}]`; }
          else { const hit = Boolean(r); statusOf.set(it.id, hit ? 'kept' : 'dropped'); if (hit) { found = true; value = it; } result = hit; }
          if (stage.perItem === true) {
            perItemSteps.push({
              caption: renderText(ctx, fillPlaceholders(stage.caption, { item: it.label, result: String(result), index: index + 1, count: before.length, acc: '' })),
              stage: si, focus: it.id,
              items: before.map((b) => ({ id: b.id, label: b.label, status: b.id === it.id ? statusOf.get(b.id) : statusOf.has(b.id) ? statusOf.get(b.id) : 'waiting' })),
              output: stage.op === 'find' ? (value ? { kind: 'value', label: value.label } : { kind: 'value', label: 'undefined' }) : { kind: 'list', items: after.map((a) => ({ id: a.id, label: a.label, from: a.from ?? a.id })) },
            });
          }
        });
        if (stage.op === 'find') { outputKind = 'value'; after = value ? [{ ...value }] : []; }
      } else if (stage.op === 'reduce') {
        let acc = structuredClone(stage.initial);
        const accItems = [];
        before.forEach((it, index) => {
          acc = fn(acc, it.value, index, before.map((x) => x.value));
          statusOf.set(it.id, 'consumed');
          const accLabel = safeShow(show, acc, `${p}.show`);
          accItems.push(accLabel);
          if (stage.perItem === true) {
            perItemSteps.push({
              caption: renderText(ctx, fillPlaceholders(stage.caption, { item: it.label, result: accLabel, index: index + 1, count: before.length, acc: accLabel })),
              stage: si, focus: it.id,
              items: before.map((b) => ({ id: b.id, label: b.label, status: statusOf.has(b.id) ? 'consumed' : 'waiting' })),
              output: { kind: 'value', label: accLabel, initial: safeShow(show, stage.initial, `${p}.show`) },
            });
          }
        });
        outputKind = 'value';
        value = { id: `i${(seq += 1)}`, value: acc, label: safeShow(show, acc, `${p}.show`) };
        after = [value];
      } else if (stage.op === 'sort') {
        const copy = before.map((it, index) => ({ it, index }));
        copy.sort((a, b) => fn(a.it.value, b.it.value));
        after = copy.map(({ it }) => ({ ...it }));
        for (const it of before) statusOf.set(it.id, 'moved');
      }
    } catch (error) {
      issues.add(`${p}.fn`, `the function threw while running: ${error.message}`);
      break;
    }
    steps.push(...perItemSteps);
    steps.push({
      caption: renderText(ctx, stage.perItem === true ? stage.summary : stage.caption),
      stage: si,
      items: before.map((b) => ({ id: b.id, label: b.label, status: statusOf.get(b.id) ?? 'waiting' })),
      output: outputKind === 'value' ? { kind: 'value', label: after[0] ? after[0].label : 'undefined', initial: stage.op === 'reduce' ? safeShow(show, stage.initial, `${p}.show`) : undefined } : { kind: 'list', items: after.map((a) => ({ id: a.id, label: a.label, from: a.from ?? a.id })) },
    });
    current = outputKind === 'value' ? after : after;
    if (outputKind === 'value' && si < spec.stages.length - 1) {
      // A later stage after reduce/find receives a single value; only array ops on arrays make sense.
      const v = after[0] ? after[0].value : undefined;
      if (!Array.isArray(v)) { issues.add(`spec.stages[${si + 1}]`, `stage ${si + 1} (${spec.stages[si + 1].op}) follows ${stage.op}, which produced a single value, not a list`); break; }
      current = v.map((x) => mkItem(x, show, `${p}.show`));
    }
  }
  const resultLabel = spec.result?.label ? renderText(ctx, fillPlaceholders(spec.result.label, { count: current.length })) : null;
  return {
    spec: {
      kind: 'pipeline',
      code: spec.code ?? null,
      language: 'js',
      input: { label: renderText(ctx, spec.input.label) },
      stages: stagesOut,
      resultLabel,
      steps,
    },
    issues,
  };
}
