// pipeline: a collection flowing through array stages (filter, map, flatMap, reduce, find, some,
// every, sort, toSorted). The author writes the input data and the stage functions as code; the
// compiler *executes* them (node:vm) so the per-item results, the comparisons a sort makes and an
// error a stage throws are all real.
import { LANGS } from '../../content-schema.js';
import { IssueList, checkArray, checkEnum, checkText, fillPlaceholders, isPlainObject, nonEmpty, renderText } from '../common.js';
import { loadExec } from '../exec.js';

export const OPS = ['filter', 'map', 'flatMap', 'reduce', 'find', 'some', 'every', 'sort', 'toSorted'];
const PREDICATE_OPS = ['find', 'some', 'every']; // stop at the deciding item (short-circuit)
const SORT_OPS = ['sort', 'toSorted'];
export const MAX_COMPARISONS = 40;

export const schema = {
  kind: 'pipeline',
  summary: 'Items flow through filter / map / flatMap / reduce / find / some / every / sort / toSorted stages; each stage shows its function and what happened to every item (short-circuits, comparisons and errors included). Results are computed by running the functions.',
  fields: {
    code: 'string — optional code shown above the pipeline (usually the chained expression)',
    input: '{ label: { uk, en }, items: [JSON values], show?: "item => string" | { uk: "item => …", en: "item => …" } (label function, bilingual labels), caption: { uk, en } }',
    stages: '[{ op: filter|map|flatMap|reduce|find|some|every|sort|toSorted, fn: "JavaScript function source", initial?: JSON (reduce), label?: string (short display of fn), show?: "value => string" | { uk, en } (labels of this stage\'s outputs), caption: { uk, en }, perItem?: boolean (not for sort/toSorted), perComparison?: boolean (sort/toSorted: one step per comparator call), summary?: { uk, en } (required with perItem/perComparison), throws?: true (the stage is meant to throw: its step shows the real error) }]',
    result: '{ label?: { uk, en } } — optional label under the final output; "{count}" is replaced by the number of items',
    'caption placeholders': 'perItem: {item} {result} {index} {count} {acc} {error}; perComparison: {a} {b} {result} {index} {count} {error}; summary and stage caption: {count} {tested} {skipped} {comparisons} {result} {error}',
  },
};

const isFnSource = (s) => nonEmpty(s) && /=>|^\s*(async\s+)?function\b/.test(s);
/** A label function: one source for both languages, or { uk, en } sources (bilingual labels). */
const isShow = (v) => isFnSource(v) || (isPlainObject(v) && LANGS.every((l) => isFnSource(v[l])) && Object.keys(v).every((k) => LANGS.includes(k)));

export function validate(spec, issues = new IssueList()) {
  if (!isPlainObject(spec)) { issues.add('spec', 'must be a mapping'); return issues; }
  if (spec.code !== undefined && !nonEmpty(spec.code)) issues.add('spec.code', 'must be a non-empty string when present');
  if (!isPlainObject(spec.input)) issues.add('spec.input', 'needs { label, items, caption }');
  else {
    checkText(issues, spec.input.label, 'spec.input.label');
    checkText(issues, spec.input.caption, 'spec.input.caption');
    checkArray(issues, spec.input.items, 'spec.input.items', { min: 1 });
    if (spec.input.show !== undefined && !isShow(spec.input.show)) issues.add('spec.input.show', 'must be a function source such as "item => item.name", or { uk, en } with one function source per language');
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
        if (SORT_OPS.includes(stage.op)) issues.add(`${p}.perItem`, `${stage.op} cannot be shown per item (a comparison is not one item): use perComparison: true`);
      }
      if (stage.perComparison !== undefined) {
        if (typeof stage.perComparison !== 'boolean') issues.add(`${p}.perComparison`, 'must be true or false');
        else if (stage.perComparison && !SORT_OPS.includes(stage.op)) issues.add(`${p}.perComparison`, 'only sort and toSorted stages have comparisons');
        else if (stage.perComparison && stage.perItem !== true) checkText(issues, stage.summary, `${p}.summary`);
      }
      if (stage.throws !== undefined && stage.throws !== true && stage.throws !== false) issues.add(`${p}.throws`, 'must be true (the stage is meant to throw) or false');
      if (stage.op === 'reduce' && !('initial' in stage)) issues.add(`${p}.initial`, 'reduce needs an "initial" value');
      if (stage.show !== undefined && !isShow(stage.show)) issues.add(`${p}.show`, 'must be a function source, or { uk, en } with one function source per language');
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
const describeError = (error) => (error && typeof error === 'object' && 'message' in error ? { name: String(error.name || 'Error'), message: String(error.message) } : { name: 'Thrown value', message: defaultShow(error) });

export async function compile(spec, ctx, issues = new IssueList()) {
  validate(spec, issues);
  if (!issues.ok) return { spec: null, issues };
  const langs = ctx.langs ?? LANGS;
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
  /** The label function(s) of a `show`: one per language (the same one twice for a plain source). */
  const showFns = (show, path) => {
    if (show === undefined) return null;
    if (typeof show === 'string') { const fn = evalFn(show, path); return fn ? Object.fromEntries(langs.map((l) => [l, fn])) : null; }
    return Object.fromEntries(langs.map((l) => [l, evalFn(show[l], `${path}.${l}`)]));
  };
  const safeShow = (fn, value, path) => {
    if (!fn) return defaultShow(value);
    try { return String(fn(value)); } catch (error) { issues.add(path, `show function failed: ${error.message}`); return defaultShow(value); }
  };
  /** A plain string when every language shows the same text, otherwise { uk, en }. */
  const labelOf = (fns, value, path) => {
    if (!fns) return defaultShow(value);
    const out = Object.fromEntries(langs.map((l) => [l, safeShow(fns[l], value, path)]));
    const texts = Object.values(out);
    return texts.every((t) => t === texts[0]) ? texts[0] : out;
  };
  const fill = (text, values) => renderText(ctx, fillPlaceholders(text, values));
  let seq = 0;
  const mkItem = (value, fns, path) => ({ id: `i${(seq += 1)}`, value, label: labelOf(fns, value, path) });
  const inputShow = showFns(spec.input.show, 'spec.input.show');
  let current = spec.input.items.map((v) => mkItem(v, inputShow, 'spec.input.show'));
  const steps = [];
  const stagesOut = [];
  steps.push({ caption: renderText(ctx, spec.input.caption), stage: -1, items: current.map((it) => ({ id: it.id, label: it.label, status: 'in' })), output: null });

  for (const [si, stage] of spec.stages.entries()) {
    const p = `spec.stages[${si}]`;
    const fn = evalFn(stage.fn, `${p}.fn`);
    // map/flatMap/reduce produce new values: without a stage "show" they are formatted generically.
    const show = showFns(stage.show, `${p}.show`);
    if (!fn) break;
    const fnLabel = stage.label ?? stage.fn.trim();
    stagesOut.push({ op: stage.op, fn: fnLabel, source: stage.fn.trim() });
    const before = current;
    const values = before.map((x) => x.value);
    const statusOf = new Map();
    const stageSteps = [];
    let after = [];
    let outputKind = 'list';
    let valueLabel = null; // reduce / find / some / every
    let thrown = null; // { name, message }
    let tested = 0;
    let comparisons = 0;
    const view = () => before.map((b) => ({ id: b.id, label: b.label, status: statusOf.get(b.id) ?? 'waiting' }));
    const listOut = () => ({ kind: 'list', items: after.map((a) => ({ id: a.id, label: a.label, from: a.from ?? a.id })) });
    const failAt = (it, error, index) => {
      thrown = describeError(error);
      statusOf.set(it.id, 'error');
      for (const rest of before.slice(index + 1)) statusOf.set(rest.id, 'skipped');
    };
    const errorText = () => `${thrown.name}: ${thrown.message}`;

    if (['filter', 'map', 'flatMap'].includes(stage.op)) {
      for (const [index, it] of before.entries()) {
        let r;
        try { r = fn(it.value, index, values); } catch (error) { failAt(it, error, index); }
        let result;
        if (thrown) result = errorText();
        else if (stage.op === 'filter') { const keep = Boolean(r); statusOf.set(it.id, keep ? 'kept' : 'dropped'); if (keep) after.push({ ...it }); result = keep; }
        else if (stage.op === 'map') { const out = mkItem(r, show, `${p}.show`); out.from = it.id; after.push(out); statusOf.set(it.id, 'mapped'); result = out.label; }
        else { const list = Array.isArray(r) ? r : [r]; const outs = list.map((v) => mkItem(v, show, `${p}.show`)); for (const out of outs) { out.from = it.id; after.push(out); } statusOf.set(it.id, 'mapped'); result = joinLabels(outs.map((o) => o.label), langs); }
        if (!thrown) tested += 1;
        if (stage.perItem === true) stageSteps.push({ caption: fill(stage.caption, { item: it.label, result, index: index + 1, count: before.length, acc: '', error: thrown ? errorText() : '' }), stage: si, focus: it.id, items: view(), output: listOut() });
        if (thrown) break;
      }
    } else if (stage.op === 'reduce') {
      let acc = structuredClone(stage.initial);
      const initialLabel = labelOf(show, stage.initial, `${p}.show`);
      for (const [index, it] of before.entries()) {
        try { acc = fn(acc, it.value, index, values); } catch (error) { failAt(it, error, index); }
        if (!thrown) { statusOf.set(it.id, 'consumed'); tested += 1; }
        const accLabel = thrown ? errorText() : labelOf(show, acc, `${p}.show`);
        if (stage.perItem === true) stageSteps.push({ caption: fill(stage.caption, { item: it.label, result: accLabel, index: index + 1, count: before.length, acc: accLabel, error: thrown ? errorText() : '' }), stage: si, focus: it.id, items: view(), output: thrown ? { kind: 'error', ...thrown } : { kind: 'value', label: accLabel, initial: initialLabel } });
        if (thrown) break;
      }
      outputKind = 'value';
      if (!thrown) {
        const value = { id: `i${(seq += 1)}`, value: acc, label: labelOf(show, acc, `${p}.show`) };
        after = [value];
        valueLabel = value.label;
      }
    } else if (PREDICATE_OPS.includes(stage.op)) {
      // find / some / every stop at the deciding item: later items are never tested.
      let decided = false;
      let answer = null;
      for (const [index, it] of before.entries()) {
        if (decided) break;
        let r;
        try { r = fn(it.value, index, values); } catch (error) { failAt(it, error, index); }
        if (!thrown) {
          tested += 1;
          const hit = Boolean(r);
          statusOf.set(it.id, hit ? 'match' : 'nomatch');
          if (stage.op === 'find' && hit) { decided = true; answer = it; }
          else if (stage.op === 'some' && hit) { decided = true; answer = true; }
          else if (stage.op === 'every' && !hit) { decided = true; answer = false; }
          if (decided) for (const rest of before.slice(index + 1)) statusOf.set(rest.id, 'skipped');
        }
        const answerLabel = () => (stage.op === 'find' ? answer.label : String(answer));
        if (stage.perItem === true) stageSteps.push({ caption: fill(stage.caption, { item: it.label, result: thrown ? errorText() : String(Boolean(r)), index: index + 1, count: before.length, acc: '', error: thrown ? errorText() : '' }), stage: si, focus: it.id, items: view(), output: thrown ? { kind: 'error', ...thrown } : decided ? { kind: 'value', label: answerLabel() } : { kind: 'pending' } });
        if (thrown) break;
      }
      outputKind = 'value';
      if (!thrown) {
        if (stage.op === 'find') { after = answer ? [{ ...answer }] : []; valueLabel = answer ? answer.label : 'undefined'; }
        else { const result = decided ? answer : stage.op === 'every'; after = [{ id: `i${(seq += 1)}`, value: result, label: String(result) }]; valueLabel = String(result); }
      }
    } else if (SORT_OPS.includes(stage.op)) {
      // The engine's own sort (V8, as in Chrome and Node) with the comparator wrapped: every call is recorded.
      const calls = [];
      const copy = before.map((it) => ({ it }));
      const compare = (x, y) => { const call = { a: x.it, b: y.it, r: undefined, threw: true }; calls.push(call); call.r = fn(x.it.value, y.it.value); call.threw = false; return call.r; };
      let sorted = null;
      try { sorted = stage.op === 'toSorted' ? copy.toSorted(compare) : copy.sort(compare); } catch (error) { thrown = describeError(error); }
      const failed = thrown ? calls.at(-1) : null;
      if (thrown) {
        // The comparator threw in the comparison that was running: no order is produced.
        if (failed) { statusOf.set(failed.a.id, 'error'); statusOf.set(failed.b.id, 'error'); }
      } else {
        after = sorted.map(({ it }) => ({ ...it }));
        for (const it of before) statusOf.set(it.id, 'moved');
      }
      tested = before.length;
      if (stage.perComparison === true) {
        if (calls.length > MAX_COMPARISONS) issues.add(`${p}.perComparison`, `the sort makes ${calls.length} comparisons; per-comparison steps are limited to ${MAX_COMPARISONS} (use fewer items)`);
        calls.forEach((call, k) => {
          const n = Number(call.r);
          const result = call.threw ? errorText() : defaultShow(call.r);
          stageSteps.push({
            caption: fill(stage.caption, { a: call.a.label, b: call.b.label, result, index: k + 1, count: calls.length, item: '', acc: '', error: call.threw ? errorText() : '' }),
            stage: si,
            compare: { a: call.a.id, b: call.b.id, result, order: call.threw ? 'error' : n < 0 ? 'a-first' : n > 0 ? 'b-first' : 'keep', index: k + 1, count: calls.length },
            items: before.map((it) => ({ id: it.id, label: it.label, status: call.threw && (it.id === call.a.id || it.id === call.b.id) ? 'error' : 'waiting' })),
            output: call.threw ? { kind: 'error', ...thrown } : { kind: 'pending' },
          });
        });
      }
      comparisons = calls.length;
    }

    // A function that throws is an authoring mistake unless the stage says the error is the point.
    if (thrown && stage.throws !== true) {
      issues.add(`${p}.fn`, `the function threw while running: ${thrown.name}: ${thrown.message} (set throws: true if the error is the point of the example)`);
      break;
    }
    if (!thrown && stage.throws === true) { issues.add(`${p}.throws`, `stage ${si + 1} (${stage.op}) was expected to throw but completed`); break; }
    steps.push(...stageSteps);
    const skipped = [...statusOf.values()].filter((s) => s === 'skipped').length;
    const placeholders = { count: before.length, tested, skipped, comparisons, result: thrown ? errorText() : outputKind === 'value' ? valueLabel ?? 'undefined' : after.length, error: thrown ? errorText() : '' };
    const output = thrown ? { kind: 'error', ...thrown } : outputKind === 'value' ? { kind: 'value', label: valueLabel ?? 'undefined', ...(stage.op === 'reduce' ? { initial: labelOf(show, stage.initial, `${p}.show`) } : {}) } : listOut();
    steps.push({ caption: fill(stage.perItem === true || stage.perComparison === true ? stage.summary : stage.caption, placeholders), stage: si, items: view(), output });
    if (thrown) {
      if (si < spec.stages.length - 1) issues.add(`spec.stages[${si + 1}]`, `stage ${si + 2} (${spec.stages[si + 1].op}) never runs: stage ${si + 1} throws`);
      break;
    }
    current = after;
    if (outputKind === 'value' && si < spec.stages.length - 1) {
      // A later stage after reduce/find/some/every receives a single value; only array ops on arrays make sense.
      const v = after[0] ? after[0].value : undefined;
      if (!Array.isArray(v)) { issues.add(`spec.stages[${si + 1}]`, `stage ${si + 2} (${spec.stages[si + 1].op}) follows ${stage.op}, which produced a single value, not a list`); break; }
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

/** "[a, b]" of possibly bilingual labels (flatMap per-item result). */
function joinLabels(labels, langs) {
  if (labels.every((l) => typeof l === 'string')) return `[${labels.join(', ')}]`;
  return Object.fromEntries(langs.map((lang) => [lang, `[${labels.map((l) => (typeof l === 'string' ? l : l[lang])).join(', ')}]`]));
}
