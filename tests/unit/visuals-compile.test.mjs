// Compilation of visual specs: real execution for code-trace / pipeline, output verification for
// event-loop, simulation for git-graph, layout for diagram, caption binding errors.
// Run: node --test tests/unit/visuals-compile.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compileVisual, specForLang, traceToSpec } from '../../shared/visuals/index.js';
import { compileSamples } from '../../scripts/content/compile-visual-samples.mjs';

const text = (s) => ({ uk: `${s} (uk)`, en: `${s} (en)` });
const ctx = (files = {}) => ({ readFile: async (p) => { if (!(p in files)) throw new Error(`ENOENT ${p}`); return files[p]; }, mdInline: (s) => `<p>${s}</p>`, langs: ['uk', 'en'] });
const messages = (issues) => issues.map((i) => `${i.path}: ${i.message}`).join('\n');

test('all sample blocks compile without issues', async () => {
  const { samples, failures } = await compileSamples();
  assert.deepEqual(failures, []);
  const kinds = ['code-trace', 'diagram', 'event-loop', 'git-graph', 'memory-graph', 'pipeline', 'render-timeline', 'sequence'];
  assert.deepEqual(samples.slice(0, kinds.length).map((s) => s.file), kinds.map((k) => `${k}.yaml`), 'the canonical sample of every kind comes first');
  assert.deepEqual([...new Set(samples.map((s) => s.visual))].sort(), kinds);
  for (const s of samples) {
    for (const lang of ['uk', 'en']) {
      const spec = specForLang(s.spec, lang);
      assert.ok(spec.steps.length >= 2, s.file);
      for (const step of spec.steps) { assert.ok(step.caption.uk && step.caption.en, `${s.file}: every step has a bilingual caption`); }
    }
    JSON.stringify(s.spec); // serializable
  }
});

test('strings: %%key%% in the code file, captions and labels is resolved per language; one compiled variant per language', async () => {
  const strings = { item: { uk: 'Лампа', en: 'Lamp' } };
  const files = { 'a.js': 'const name = "%%item%%";\nconsole.log(name);\n' };
  const captions = [{ at: { line: 2 }, text: { uk: 'бачимо %%item%%', en: 'we see %%item%%' } }];
  const r = await compileVisual('code-trace', { file: 'a.js', captions }, { ...ctx(files), strings });
  assert.deepEqual(r.issues, [], messages(r.issues));
  assert.deepEqual(Object.keys(r.spec), ['kind', 'byLang']);
  assert.equal(r.spec.kind, 'code-trace');
  assert.equal(r.spec.byLang.uk.code, 'const name = "Лампа";\nconsole.log(name);\n');
  assert.equal(r.spec.byLang.en.code, 'const name = "Lamp";\nconsole.log(name);\n');
  assert.deepEqual(r.spec.byLang.uk.console, [{ level: 'log', text: 'Лампа' }]);
  assert.deepEqual(r.spec.byLang.en.console, [{ level: 'log', text: 'Lamp' }]);
  assert.equal(r.spec.byLang.uk.steps[0].trace.scopes[r.spec.byLang.uk.steps[0].trace.scope].vars[0].value.v, 'Лампа', 'the trace really ran the Ukrainian text');
  assert.equal(r.spec.byLang.uk.steps[0].caption.uk, '<p>бачимо Лампа</p>');
  assert.equal(r.spec.byLang.en.steps[0].caption.en, '<p>we see Lamp</p>');
  assert.equal(specForLang(r.spec, 'en'), r.spec.byLang.en);
  // Plain-text labels drawn in pictures (diagram), pipeline data and their labels.
  const d = await compileVisual('diagram', { nodes: [{ id: 'a', label: '%%item%%' }, { id: 'b', label: 'fixed' }], steps: [{ caption: text('x') }] }, { ...ctx(), strings });
  assert.deepEqual(d.issues, []);
  assert.deepEqual(d.spec.byLang.uk.nodes[0].label, { uk: 'Лампа', en: 'Лампа' });
  assert.deepEqual(d.spec.byLang.en.nodes[0].label, { uk: 'Lamp', en: 'Lamp' });
  const p = await compileVisual('pipeline', { input: { label: text('in'), caption: text('c'), items: [{ name: '%%item%%', price: 5 }] }, stages: [{ op: 'map', fn: 'x => x.name.toUpperCase()', caption: text('m') }] }, { ...ctx(), strings });
  assert.deepEqual(p.issues, [], messages(p.issues));
  assert.deepEqual(p.spec.byLang.uk.steps.at(-1).output.items.map((i) => i.label), ['ЛАМПА']);
  assert.deepEqual(p.spec.byLang.en.steps.at(-1).output.items.map((i) => i.label), ['LAMP']);
  // Strings that reach nothing visible collapse to the plain shape.
  const unused = await compileVisual('code-trace', { code: 'let a = 1;\n', captions: [{ at: { line: 1 }, text: text('a') }] }, { ...ctx(), strings });
  assert.equal(unused.spec.kind, 'code-trace');
  assert.equal(unused.spec.byLang, undefined);
});

test('strings: unknown keys, a missing table and language-dependent steps are refused', async () => {
  const strings = { item: { uk: 'Лампа', en: 'Lamp' } };
  const cap = [{ at: { line: 1 }, text: text('a') }];
  const unknown = await compileVisual('code-trace', { code: 'const a = "%%nope%%";\n', captions: cap }, { ...ctx(), strings });
  assert.equal(unknown.spec, null);
  assert.match(messages(unknown.issues), /strings: placeholder %%nope%% has no entry in strings/);
  const noTable = await compileVisual('code-trace', { file: 'a.js', captions: cap }, ctx({ 'a.js': 'const a = "%%item%%";\n' }));
  assert.equal(noTable.spec, null);
  assert.match(messages(noTable.issues), /placeholder %%item%% has no entry in strings \(add a strings table to the block\)/);
  // "Лампа" has 5 letters, "Lamp" 4: the loop runs a different number of times in each language.
  const loop = { code: 'const word = "%%item%%";\nfor (const ch of word) {\n  ch;\n}\n', steps: 'all', captions: [{ at: { line: 1 }, text: text('a') }, { at: { line: 2, hit: 'every' }, text: text('b') }, { at: { line: 3, hit: 'every' }, text: text('c') }, { at: { line: 4, kind: 'end' }, text: text('d') }] };
  const diverge = await compileVisual('code-trace', loop, { ...ctx(), strings });
  assert.equal(diverge.spec, null);
  assert.match(messages(diverge.issues), /the uk and en versions have different numbers of steps \(\d+ and \d+\)/);
  // A caption that only matches in one language names that language.
  const oneLang = await compileVisual('code-trace', { code: 'const word = "%%item%%";\nif (word.length > 4) {\n  console.log(word);\n}\n', captions: [{ at: { line: 3 }, text: text('long') }] }, { ...ctx(), strings });
  assert.match(messages(oneLang.issues), /no step runs line 3.*\(with the en strings\)/);
});

test('lesson build: a visual block with strings gets localized title, text equivalent and spec', async () => {
  const { compileLesson, createMarkdown } = await import('../../scripts/content/lib.mjs');
  const visuals = await import('../../shared/visuals/index.js');
  const block = {
    id: 'v', kind: 'visual', visual: 'code-trace', strings: { item: { uk: 'Лампа', en: 'Lamp' } },
    title: { uk: 'Про %%item%%', en: 'About %%item%%' }, textEquivalent: { uk: 'Рядок «%%item%%».', en: 'The string "%%item%%".' },
    spec: { code: 'const a = "%%item%%";\nconsole.log(a);\n', captions: [{ at: { line: 2 }, text: { uk: 'виводить %%item%%', en: 'prints %%item%%' } }] },
  };
  const { lesson, issues } = await compileLesson({ dir: '/nonexistent', assets: {}, source: { id: 'js-99-01-strings', blocks: [block] } }, { md: createMarkdown(new Map()), visuals });
  assert.deepEqual(issues, []);
  const out = lesson.blocks[0];
  assert.deepEqual(out.title, { uk: 'Про Лампа', en: 'About Lamp' });
  assert.equal(out.textEquivalent.en, '<p>The string &quot;Lamp&quot;.</p>');
  assert.equal(out.spec.byLang.uk.console[0].text, 'Лампа');
  assert.equal(out.spec.byLang.en.steps[0].caption.en, 'prints Lamp');
});

test('code-trace: captions bind to generated steps; unmatched or ambiguous captions fail', async () => {
  const files = { 'a.js': 'let a = 1;\nfor (let i = 0; i < 2; i++) {\n  a += i;\n}\nconsole.log(a);\n' };
  const good = await compileVisual('code-trace', { file: 'a.js', captions: [{ at: { line: 1 }, text: text('start') }, { at: { line: 3, hit: 2 }, text: text('second') }, { at: { line: 5 }, text: text('log') }] }, ctx(files));
  assert.deepEqual(good.issues, []);
  assert.equal(good.spec.kind, 'code-trace');
  assert.equal(good.spec.steps.length, 3);
  assert.deepEqual(good.spec.steps.map((s) => s.trace.line), [1, 3, 5]);
  assert.equal(good.spec.steps[0].caption.uk, '<p>start (uk)</p>');
  assert.equal(good.spec.steps[2].logged, 0);
  assert.deepEqual(good.spec.console, [{ level: 'log', text: '2' }]);
  const bad = await compileVisual('code-trace', { file: 'a.js', captions: [{ at: { line: 4 }, text: text('x') }, { at: { line: 3, hit: 9 }, text: text('y') }, { at: { step: 99 }, text: text('z') }] }, ctx(files));
  assert.equal(bad.spec, null);
  assert.match(messages(bad.issues), /no step runs line 4/);
  assert.match(messages(bad.issues), /line 3 runs 2 times, hit 9 does not exist/);
  assert.match(messages(bad.issues), /step 99 does not exist/);
  const missing = await compileVisual('code-trace', { file: 'nope.js', captions: [{ at: { line: 1 }, text: text('x') }] }, ctx(files));
  assert.match(messages(missing.issues), /cannot read "nope.js"/);
});

test('code-trace: steps "all" requires a caption on every shown step; hit "every" covers repeats', async () => {
  const files = { 'a.js': 'let n = 0;\nn += 1;\nn += 1;\n' };
  const strict = await compileVisual('code-trace', { file: 'a.js', steps: 'all', captions: [{ at: { line: 1 }, text: text('a') }] }, ctx(files));
  assert.match(messages(strict.issues), /step 2 \(line 2, stmt\) has no caption/);
  const every = await compileVisual('code-trace', { code: 'for (let i = 0; i < 2; i++) {\n  i;\n}\n', steps: 'all', captions: [{ at: { line: 1, hit: 'every' }, text: text('test') }, { at: { line: 2, hit: 'every' }, text: text('body') }, { at: { line: 3 }, text: text('end') }] }, ctx());
  assert.deepEqual(every.issues, [], messages(every.issues));
  assert.equal(every.spec.steps.length, every.spec.totalSteps);
});

test('code-trace: a throwing program is accepted and ends with the throw step; truncation is refused by default', async () => {
  const thrown = await compileVisual('code-trace', { code: 'console.log(x);\nlet x = 1;\n', captions: [{ at: { line: 1, kind: 'throw' }, text: text('tdz') }] }, ctx());
  assert.deepEqual(thrown.issues, []);
  assert.equal(thrown.spec.error.name, 'ReferenceError');
  assert.equal(thrown.spec.steps[0].trace.event.type, 'throw');
  const cut = await compileVisual('code-trace', { code: 'for (let i = 0; i < 500; i++) { i; }\n', maxSteps: 20, captions: [{ at: { line: 1 }, text: text('x') }] }, ctx());
  assert.match(messages(cut.issues), /cut at 20 steps/);
});

test('traceToSpec wraps a run-time trace in the compiled shape without captions', async () => {
  const { runTraced } = await import('../../shared/visuals/exec-node.js');
  const { trace } = await runTraced('const a = 1;\nconsole.log(a);\n', { file: 'index.js' });
  const spec = traceToSpec(trace, 'const a = 1;\nconsole.log(a);\n', 'index.js');
  assert.equal(spec.kind, 'code-trace');
  assert.equal(spec.steps.length, trace.steps.length);
  assert.equal(spec.steps[0].caption, null);
  assert.equal(spec.steps.at(-1).logged, 1);
});

test('memory-graph from a trace derives bindings and heap per captioned step', async () => {
  const r = await compileVisual('memory-graph', { from: 'trace', code: 'const a = { n: 1 };\nconst b = a;\nb.n = 2;\n', captions: [{ at: { line: 2 }, text: text('one') }, { at: { line: 3 }, text: text('two') }] }, ctx());
  assert.deepEqual(r.issues, [], messages(r.issues));
  assert.equal(r.spec.kind, 'memory-graph');
  assert.equal(r.spec.steps.length, 2);
  assert.deepEqual(r.spec.steps[0].bindings.map((b) => b.name), ['a', 'b']);
  assert.equal(r.spec.steps[0].bindings[1].value.t, 'uninit');
  assert.equal(r.spec.steps[1].bindings[0].value.id, r.spec.steps[1].bindings[1].value.id, 'same heap object');
  assert.deepEqual(r.spec.steps[1].changed, ['b']);
});

test('memory-graph: { empty: true } marks a hole of a sparse array, exactly as a real trace shows it', async () => {
  const r = await compileVisual('memory-graph', { states: [{ caption: text('a'), bindings: [{ name: 'list', kind: 'const', value: { ref: 'a' } }], heap: { a: { kind: 'array', items: [1, { empty: true }, 3] } } }] }, ctx());
  assert.deepEqual(r.issues, [], messages(r.issues));
  assert.deepEqual(r.spec.steps[0].heap.a, { t: 'array', length: 3, items: [{ t: 'number', v: 1 }, { t: 'empty' }, { t: 'number', v: 3 }], more: 0 });
  const { runTraced } = await import('../../shared/visuals/exec-node.js');
  const { trace } = await runTraced('const list = [1, , 3];\n', { file: 'a.js' });
  const real = Object.values(trace.steps.at(-1).heap).find((h) => h.t === 'array');
  assert.deepEqual(real.items, r.spec.steps[0].heap.a.items, 'authored and traced holes look the same');
  assert.equal(real.length, 3);
});

test('memory-graph authored states diff into "changed" when not given', async () => {
  const r = await compileVisual('memory-graph', { states: [
    { caption: text('a'), bindings: [{ name: 'x', value: { ref: 'o' } }], heap: { o: { kind: 'object', props: { n: 1 } } } },
    { caption: text('b'), bindings: [{ name: 'x', value: { ref: 'o' } }, { name: 'y', value: 'undefined' }], heap: { o: { kind: 'object', props: { n: 2 } } } },
  ] }, ctx());
  assert.deepEqual(r.issues, []);
  assert.deepEqual(r.spec.steps[1].changed, ['y', 'o']);
  assert.deepEqual(r.spec.steps[1].bindings[1].value, { t: 'undefined' });
  assert.deepEqual(r.spec.steps[1].heap.o.props, [['n', { t: 'number', v: 2 }]]);
});

test('pipeline executes the stage functions: per-item filter steps, map labels, reduce accumulator', async () => {
  const r = await compileVisual('pipeline', {
    input: { label: text('in'), caption: text('input'), items: [{ n: 1 }, { n: 5 }, { n: 3 }], show: 'x => `n${x.n}`' },
    stages: [
      { op: 'filter', fn: 'x => x.n < 4', perItem: true, caption: text('{item} → {result}'), summary: text('kept') },
      { op: 'map', fn: 'x => x.n * 10', caption: text('times ten') },
      { op: 'reduce', fn: '(acc, x) => acc + x', initial: 0, caption: text('sum') },
    ],
    result: { label: text('{count} left') },
  }, ctx());
  assert.deepEqual(r.issues, [], messages(r.issues));
  const steps = r.spec.steps;
  assert.equal(steps.length, 1 + 3 + 1 + 1 + 1);
  assert.equal(steps[1].caption.en, '<p>n1 → true (en)</p>');
  assert.equal(steps[2].caption.en, '<p>n5 → false (en)</p>');
  assert.deepEqual(steps[2].items.map((i) => i.status), ['kept', 'dropped', 'waiting']);
  assert.deepEqual(steps[4].output.items.map((i) => i.label), ['n1', 'n3']);
  assert.deepEqual(steps[5].output.items.map((i) => i.label), ['10', '30']);
  assert.deepEqual(steps[6].output, { kind: 'value', label: '40', initial: '0' });
  assert.equal(r.spec.resultLabel.en, '<p>1 left (en)</p>');
  const broken = await compileVisual('pipeline', { input: { label: text('in'), caption: text('c'), items: [1] }, stages: [{ op: 'map', fn: 'x => x.boom()', caption: text('m') }] }, ctx());
  assert.match(messages(broken.issues), /threw while running/);
});

test('pipeline: some / every / find stop at the deciding item; later items are shown as not checked', async () => {
  const input = { label: text('in'), caption: text('c'), items: [1, 4, 6, 3], show: 'n => `n${n}`' };
  const stage = (op, fn) => ({ op, fn, perItem: true, caption: text('{item} → {result}'), summary: text('{tested} of {count}, {skipped} skipped → {result}') });
  const some = await compileVisual('pipeline', { input, stages: [stage('some', 'n => n > 3')] }, ctx());
  assert.deepEqual(some.issues, [], messages(some.issues));
  const s = some.spec.steps;
  assert.equal(s.length, 1 + 2 + 1, 'input, two tested items, the result: no step for the items after the first true');
  assert.deepEqual(s[1].items.map((i) => i.status), ['nomatch', 'waiting', 'waiting', 'waiting']);
  assert.deepEqual(s[1].output, { kind: 'pending' });
  assert.deepEqual(s[2].items.map((i) => i.status), ['nomatch', 'match', 'skipped', 'skipped'], 'the short-circuit is visible on the deciding step');
  assert.deepEqual(s[2].output, { kind: 'value', label: 'true' });
  assert.equal(s[3].caption.en, '<p>2 of 4, 2 skipped → true (en)</p>');
  const every = await compileVisual('pipeline', { input, stages: [stage('every', 'n => n < 5')] }, ctx());
  assert.deepEqual(every.spec.steps.at(-1).items.map((i) => i.status), ['match', 'match', 'nomatch', 'skipped']);
  assert.deepEqual(every.spec.steps.at(-1).output, { kind: 'value', label: 'false' });
  const all = await compileVisual('pipeline', { input, stages: [stage('every', 'n => n > 0')] }, ctx());
  assert.deepEqual(all.spec.steps.at(-1).output, { kind: 'value', label: 'true' }, 'every with no false checks everything');
  assert.equal(all.spec.steps.length, 1 + 4 + 1);
  const find = await compileVisual('pipeline', { input, stages: [stage('find', 'n => n % 2 === 0')] }, ctx());
  assert.deepEqual(find.spec.steps.at(-1).output, { kind: 'value', label: 'n4' });
  assert.deepEqual(find.spec.steps.at(-1).items.map((i) => i.status), ['nomatch', 'match', 'skipped', 'skipped']);
  const none = await compileVisual('pipeline', { input, stages: [stage('find', 'n => n > 100')] }, ctx());
  assert.deepEqual(none.spec.steps.at(-1).output, { kind: 'value', label: 'undefined' });
  // These results are what the real methods return.
  assert.deepEqual([[1, 4, 6, 3].some((n) => n > 3), [1, 4, 6, 3].every((n) => n < 5), [1, 4, 6, 3].find((n) => n % 2 === 0)], [true, false, 4]);
});

test('pipeline: sort / toSorted can show every real comparator call; toSorted keeps its own name', async () => {
  const items = [45, 240, 80, 12];
  const r = await compileVisual('pipeline', { input: { label: text('in'), caption: text('c'), items }, stages: [{ op: 'toSorted', fn: '(a, b) => a - b', perComparison: true, caption: text('{index}/{count}: a={a} b={b} → {result}'), summary: text('{comparisons} comparisons') }] }, ctx());
  assert.deepEqual(r.issues, [], messages(r.issues));
  assert.equal(r.spec.stages[0].op, 'toSorted');
  // The comparisons the engine really makes (same V8 sort as the compiler).
  const calls = [];
  const expected = items.toSorted((a, b) => { calls.push([a, b]); return a - b; });
  const comparisonSteps = r.spec.steps.filter((s) => s.compare);
  assert.equal(comparisonSteps.length, calls.length);
  const label = (id) => r.spec.steps[0].items.find((i) => i.id === id).label;
  assert.deepEqual(comparisonSteps.map((s) => [Number(label(s.compare.a)), Number(label(s.compare.b))]), calls);
  assert.deepEqual(comparisonSteps.map((s) => s.compare.order), calls.map(([a, b]) => (a - b < 0 ? 'a-first' : a - b > 0 ? 'b-first' : 'keep')));
  assert.equal(comparisonSteps[0].caption.en, `<p>1/${calls.length}: a=${calls[0][0]} b=${calls[0][1]} → ${calls[0][0] - calls[0][1]} (en)</p>`);
  assert.deepEqual(comparisonSteps[0].output, { kind: 'pending' });
  const last = r.spec.steps.at(-1);
  assert.deepEqual(last.output.items.map((i) => Number(i.label)), expected);
  assert.equal(last.caption.en, `<p>${calls.length} comparisons (en)</p>`);
  assert.deepEqual(last.items.map((i) => i.status), ['moved', 'moved', 'moved', 'moved']);
  const tooMany = await compileVisual('pipeline', { input: { label: text('in'), caption: text('c'), items: Array.from({ length: 30 }, (_, i) => (i * 7919) % 101) }, stages: [{ op: 'sort', fn: '(a, b) => a - b', perComparison: true, caption: text('x'), summary: text('y') }] }, ctx());
  assert.match(messages(tooMany.issues), /per-comparison steps are limited to 40/);
});

test('pipeline: item labels can be bilingual; captions take the label of their language', async () => {
  const r = await compileVisual('pipeline', {
    input: { label: text('in'), caption: text('c'), items: [{ n: 'Lamp', p: 45 }, { n: 'Desk', p: 240 }], show: { uk: 'x => `${x.n}: ${x.p} грн`', en: 'x => `${x.n}: €${x.p}`' } },
    stages: [{ op: 'filter', fn: 'x => x.p < 100', perItem: true, caption: { uk: 'перевіряємо {item}', en: 'checking {item}' }, summary: text('s') }, { op: 'map', fn: 'x => x.n', show: { uk: 'n => `назва ${n}`', en: 'n => `name ${n}`' }, caption: text('m') }],
  }, ctx());
  assert.deepEqual(r.issues, [], messages(r.issues));
  assert.deepEqual(r.spec.steps[0].items[0].label, { uk: 'Lamp: 45 грн', en: 'Lamp: €45' });
  assert.equal(r.spec.steps[1].caption.uk, '<p>перевіряємо Lamp: 45 грн</p>');
  assert.equal(r.spec.steps[1].caption.en, '<p>checking Lamp: €45</p>');
  assert.deepEqual(r.spec.steps.at(-1).output.items[0].label, { uk: 'назва Lamp', en: 'name Lamp' });
  // A plain `show` keeps plain string labels (unchanged shape).
  const plain = await compileVisual('pipeline', { input: { label: text('in'), caption: text('c'), items: [1], show: 'x => `#${x}`' }, stages: [{ op: 'map', fn: 'x => x', caption: text('m') }] }, ctx());
  assert.equal(plain.spec.steps[0].items[0].label, '#1');
});

test('pipeline: a stage marked throws shows the real error; an unexpected or missing throw is refused', async () => {
  let real;
  try { undefined.trim(); } catch (error) { real = error; }
  const input = { label: text('in'), caption: text('c'), items: [{ note: ' a ' }, {}, { note: 'c' }] };
  const mapStage = { op: 'map', fn: 'x => x.note.trim()', throws: true, perItem: true, caption: text('{item} → {result}'), summary: text('stopped: {error}') };
  const r = await compileVisual('pipeline', { input, stages: [mapStage] }, ctx());
  assert.deepEqual(r.issues, [], messages(r.issues));
  const last = r.spec.steps.at(-1);
  assert.deepEqual(last.output, { kind: 'error', name: real.name, message: real.message });
  assert.deepEqual(last.items.map((i) => i.status), ['mapped', 'error', 'skipped']);
  assert.equal(last.caption.en, `<p>stopped: ${real.name}: ${real.message} (en)</p>`);
  assert.equal(r.spec.steps.length, 1 + 2 + 1, 'the third item is never reached');
  const unexpected = await compileVisual('pipeline', { input, stages: [{ ...mapStage, throws: undefined }] }, ctx());
  assert.match(messages(unexpected.issues), /threw while running: TypeError: .*set throws: true/);
  const notThrown = await compileVisual('pipeline', { input, stages: [{ ...mapStage, fn: 'x => x.note' }] }, ctx());
  assert.match(messages(notThrown.issues), /expected to throw but completed/);
  const after = await compileVisual('pipeline', { input, stages: [mapStage, { op: 'filter', fn: 'x => x', caption: text('f') }] }, ctx());
  assert.match(messages(after.issues), /stage 2 \(filter\) never runs: stage 1 throws/);
  const comparator = await compileVisual('pipeline', { input: { label: text('in'), caption: text('c'), items: [2, 1] }, stages: [{ op: 'sort', fn: '(a, b) => a.x.y - b', throws: true, caption: text('{error}') }] }, ctx());
  assert.deepEqual(comparator.issues, [], messages(comparator.issues));
  assert.equal(comparator.spec.steps.at(-1).output.kind, 'error');
  assert.deepEqual(comparator.spec.steps.at(-1).items.map((i) => i.status), ['error', 'error'], 'the two items of the failing comparison');
});

test('event-loop: the claimed console order is verified against the real output', async () => {
  const code = 'console.log("A");\nsetTimeout(() => console.log("C"), 0);\nPromise.resolve().then(() => console.log("B"));\n';
  const step = (log, stack = []) => ({ caption: text('s'), stack, log });
  const right = await compileVisual('event-loop', { code, steps: [step('A', ['script']), step('B'), step('C')] }, ctx());
  assert.deepEqual(right.issues, [], messages(right.issues));
  assert.deepEqual(right.spec.console.map((c) => c.text), ['A', 'B', 'C']);
  assert.deepEqual(right.spec.steps.map((s) => s.logged), [1, 2, 3]);
  const wrong = await compileVisual('event-loop', { code, steps: [step('A', ['script']), step('C'), step('B')] }, ctx());
  assert.equal(wrong.spec, null);
  assert.match(messages(wrong.issues), /does not match the real output/);
  assert.match(messages(wrong.issues), /claimed: \["A","C","B"\]/);
  assert.match(messages(wrong.issues), /actual: {2}\["A","B","C"\]/);
  assert.match(messages(wrong.issues), /first difference at output line 2/);
  const unfinished = await compileVisual('event-loop', { code, steps: [step('A', ['script']), step(['B', 'C'], ['still here'])] }, ctx());
  assert.match(messages(unfinished.issues), /empty stack and empty queues/);
});

test('event-loop: console text formatting matches the documented rules', async () => {
  const code = 'console.log("x", 1, true, null, undefined, [1, "a"], { a: 1, b: "s" });\n';
  const r = await compileVisual('event-loop', { code, steps: [{ caption: text('a'), stack: ['script'], log: 'x 1 true null undefined [1, "a"] { a: 1, b: "s" }' }, { caption: text('b'), stack: [] }] }, ctx());
  assert.deepEqual(r.issues, [], messages(r.issues));
});

test('git-graph init: args are shown after "git init" and a -b name names the branch', async () => {
  const cap = text('c');
  const plain = await compileVisual('git-graph', { steps: [{ op: 'init', caption: cap }] }, ctx());
  assert.equal(plain.spec.steps[0].command, 'git init');
  const named = await compileVisual('git-graph', { steps: [{ op: 'init', args: '-b trunk', caption: cap }, { op: 'commit', message: 'one', caption: cap }] }, ctx());
  assert.deepEqual(named.issues, [], messages(named.issues));
  assert.equal(named.spec.steps[0].command, 'git init -b trunk');
  assert.equal(named.spec.steps[1].branches[0].name, 'trunk');
  const both = await compileVisual('git-graph', { steps: [{ op: 'init', args: '--initial-branch=main', branch: 'main', caption: cap }] }, ctx());
  assert.deepEqual(both.issues, [], messages(both.issues));
  assert.equal(both.spec.steps[0].command, 'git init --initial-branch=main');
  const mismatch = await compileVisual('git-graph', { steps: [{ op: 'init', args: '-b dev', branch: 'main', caption: cap }] }, ctx());
  assert.match(messages(mismatch.issues), /names the branch "dev" but branch is "main"/);
  const empty = await compileVisual('git-graph', { steps: [{ op: 'init', args: '', caption: cap }] }, ctx());
  assert.match(messages(empty.issues), /text after "git init"/);
});

test('git-graph simulation: fast-forward, merge commit, conflict, rebase and errors', async () => {
  const cap = text('c');
  const r = await compileVisual('git-graph', { steps: [
    { op: 'init', caption: cap }, { op: 'commit', message: 'one', caption: cap }, { op: 'branch', name: 'f', caption: cap }, { op: 'commit', message: 'two', caption: cap },
    { op: 'checkout', name: 'main', caption: cap }, { op: 'merge', from: 'f', caption: cap },
    { op: 'branch', name: 'g', caption: cap }, { op: 'commit', message: 'three', caption: cap }, { op: 'checkout', name: 'main', caption: cap }, { op: 'commit', message: 'four', files: ['a.js'], caption: cap },
    { op: 'merge', from: 'g', conflict: ['a.js'], caption: cap }, { op: 'resolve', files: ['a.js'], caption: cap }, { op: 'commit', message: 'merge g', caption: cap },
    { op: 'branch', name: 'h', caption: cap }, { op: 'commit', message: 'five', caption: cap }, { op: 'checkout', name: 'main', caption: cap }, { op: 'commit', message: 'six', caption: cap }, { op: 'checkout', name: 'h', caption: cap }, { op: 'rebase', onto: 'main', caption: cap },
  ] }, ctx());
  assert.deepEqual(r.issues, [], messages(r.issues));
  const s = r.spec.steps;
  assert.equal(s[5].branches.find((b) => b.name === 'main').at, 'c2', 'fast-forward moves main to c2');
  assert.match(s[5].command, /fast-forward/);
  assert.deepEqual(s[10].workingTree.conflicted, ['a.js']);
  assert.equal(s[10].merging, 'g');
  assert.deepEqual(s[11].workingTree, { modified: [], staged: ['a.js'], conflicted: [] });
  const mergeCommit = s[12].commits.find((c) => c.message === 'merge g');
  assert.deepEqual(mergeCommit.parents, ['c4', 'c3']);
  assert.equal(s[12].merging, null);
  const last = s.at(-1);
  assert.ok(last.commits.find((c) => c.id === 'c6').orphaned, 'rebased commit is orphaned');
  assert.equal(last.branches.find((b) => b.name === 'h').at, 'c6′');
  assert.deepEqual(last.commits.find((c) => c.id === 'c6′').parents, ['c7']);
  const bad = await compileVisual('git-graph', { steps: [{ op: 'init', caption: cap }, { op: 'merge', from: 'nope', caption: cap }, { op: 'stage', files: ['x'], caption: cap }] }, ctx());
  assert.match(messages(bad.issues), /unknown branch "nope"/);
  assert.match(messages(bad.issues), /no working tree change to stage/);
});

test('diagram layout places grouped nodes in group columns and sizes the viewBox', async () => {
  const r = await compileVisual('diagram', {
    groups: [{ id: 'g1', label: 'Left' }, { id: 'g2', label: 'Right' }],
    nodes: [{ id: 'a', label: 'A', group: 'g1' }, { id: 'b', label: 'B', group: 'g1' }, { id: 'c', label: 'C', group: 'g2' }],
    edges: [{ from: 'a', to: 'c', label: text('go') }],
    hidden: ['b'],
    steps: [{ caption: text('one'), highlight: ['a'] }, { caption: text('two'), show: ['b'], annotate: [{ id: 'c', text: 'note' }] }],
  }, ctx());
  assert.deepEqual(r.issues, [], messages(r.issues));
  const n = Object.fromEntries(r.spec.nodes.map((x) => [x.id, x]));
  assert.ok(n.a.x < n.c.x, 'group columns left to right');
  assert.equal(n.a.x, n.b.x);
  assert.ok(n.b.y > n.a.y);
  assert.ok(r.spec.layout.width > n.c.x + n.c.w && r.spec.layout.height > n.b.y + n.b.h);
  assert.deepEqual(r.spec.steps[0].hidden, ['b']);
  assert.deepEqual(r.spec.steps[1].hidden, []);
  assert.deepEqual(r.spec.edges[0].label, { uk: 'go (uk)', en: 'go (en)' });
  assert.deepEqual(r.spec.steps[1].annotate, [{ id: 'c', text: { uk: 'note', en: 'note' } }]);
});

test('diagram layout: groups stacked in rows (tb, or a grid) get room for both frames; side-by-side groups stay compact', async () => {
  const spec = (layout, extra = {}) => ({
    layout,
    groups: [{ id: 'g1', label: 'Browser' }, { id: 'g2', label: 'Server' }],
    nodes: [{ id: 'a', label: 'A', group: 'g1', ...extra.a }, { id: 'b', label: 'B', group: 'g1', ...extra.b }, { id: 'c', label: 'C', group: 'g2', ...extra.c }],
    edges: [{ from: 'b', to: 'c' }],
    steps: [{ caption: text('one') }],
  });
  const disjoint = (out) => {
    const [g1, g2] = out.spec.groups;
    return g1.y + g1.h < g2.y || g2.y + g2.h < g1.y || g1.x + g1.w < g2.x || g2.x + g2.w < g1.x;
  };
  const tb = await compileVisual('diagram', spec('tb'), ctx());
  assert.deepEqual(tb.issues, []);
  assert.ok(disjoint(tb), `tb frames do not overlap: ${JSON.stringify(tb.spec.groups)}`);
  const grid = await compileVisual('diagram', spec('grid', { a: { col: 0, row: 0 }, b: { col: 1, row: 0 }, c: { col: 0, row: 1 } }), ctx());
  assert.ok(disjoint(grid), 'a grid stacking groups in rows');
  const lr = await compileVisual('diagram', spec('lr'), ctx());
  assert.ok(disjoint(lr));
  const [a, b] = lr.spec.nodes;
  assert.equal(b.y - a.y, 46 + 22, 'nodes of one group column keep the normal row gap');
});

test('diagram size: annotations under the bottom row and labels wider than the picture fit inside it', async () => {
  const { edgeLabelBox, edgeLine, insideWidth, nodeNoteBox } = await import('../../shared/visuals/kinds/diagram-geometry.js');
  const long = 'a note that is much longer than the two narrow boxes are wide together';
  const r = await compileVisual('diagram', {
    layout: 'tb',
    nodes: [{ id: 'top', label: 'Top' }, { id: 'low', label: 'Low' }],
    edges: [{ from: 'top', to: 'low', label: { uk: 'короткий', en: 'a much longer English edge label' } }],
    steps: [{ caption: text('one') }, { caption: text('two'), annotate: [{ id: 'low', text: { uk: 'під нижнім рядом', en: long } }] }],
  }, ctx());
  assert.deepEqual(r.issues, [], messages(r.issues));
  const { width, height } = r.spec.layout;
  const n = Object.fromEntries(r.spec.nodes.map((x) => [x.id, x]));
  for (const lang of ['uk', 'en']) {
    const note = insideWidth(nodeNoteBox(n.low, r.spec.steps[1].annotate[0].text[lang]), width);
    assert.ok(note.y + note.h <= height, `${lang}: the annotation under the bottom row is inside the picture (${note.y + note.h} ≤ ${height})`);
    assert.ok(note.x >= 0 && note.x + note.w <= width, `${lang}: and inside its width`);
    const label = insideWidth(edgeLabelBox(edgeLine(n.top, n.low), r.spec.edges[0].label[lang]), width);
    assert.ok(label.x >= 0 && label.x + label.w <= width, `${lang}: the edge label is inside the width`);
  }
  // A picture without annotations or labels keeps the size of its boxes.
  const plain = await compileVisual('diagram', { nodes: [{ id: 'a', label: 'A' }], steps: [{ caption: text('one') }] }, ctx());
  assert.deepEqual(plain.spec.layout, { width: plain.spec.nodes[0].x + plain.spec.nodes[0].w + 10, height: plain.spec.nodes[0].y + 46 + 10 });
});

test('sequence width: recorded at compile time with the formula of the player; wide ones are a lesson warning', async () => {
  const { sequenceWidth } = await import('../../shared/visuals/kinds/sequence-geometry.js');
  const spec = (labels) => ({ actors: labels.map((label, i) => ({ id: `a${i}`, label })), messages: [{ from: 'a0', to: 'a1', label: 'GET', caption: text('one') }] });
  const short = await compileVisual('sequence', spec(['Page', 'Browser', 'Server']), ctx());
  assert.equal(short.spec.layout.width, 40 + 3 * 96 + 2 * 40);
  const long = await compileVisual('sequence', spec([{ uk: 'Код сторінки', en: 'Page code' }, 'api.example server', 'Database', 'Cache']), ctx());
  assert.equal(long.spec.layout.width, sequenceWidth(long.spec.actors));
  assert.ok(long.spec.layout.width > 450);
});

test('sequence and render-timeline compile to one step per message / per phase', async () => {
  const seq = await compileVisual('sequence', { actors: [{ id: 'a', label: 'A' }, { id: 'b', label: text('B') }], intro: text('i'), messages: [{ from: 'a', to: 'b', label: 'hi', caption: text('m1') }, { from: 'b', to: 'a', label: 'ok', kind: 'return', caption: text('m2') }] }, ctx());
  assert.deepEqual(seq.issues, []);
  assert.deepEqual(seq.spec.steps.map((s) => s.message), [-1, 0, 1]);
  assert.equal(seq.spec.messages[1].kind, 'return');
  const rt = await compileVisual('render-timeline', { steps: [
    { phase: 'render', render: 1, reason: text('first'), snapshot: { state: { n: 0 } }, caption: text('r1') },
    { phase: 'commit', render: 1, dom: '<p>0</p>', caption: text('c1') },
    { phase: 'event', name: 'click', sees: { n: 0 }, actions: ['setN(1)'], queued: { n: 1 }, caption: text('e') },
    { phase: 'render', render: 2, reason: text('update'), snapshot: { state: { n: 1 } }, caption: text('r2') },
  ] }, ctx());
  assert.deepEqual(rt.issues, [], messages(rt.issues));
  assert.deepEqual(rt.spec.renders, [1, 2]);
  assert.equal(rt.spec.steps[2].dom, '<p>0</p>', 'the DOM persists between commits');
  assert.deepEqual(rt.spec.steps[2].snapshot.state, { n: 0 });
  assert.deepEqual(rt.spec.steps[3].snapshot.state, { n: 1 });
});
