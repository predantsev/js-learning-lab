// Compilation of visual specs: real execution for code-trace / pipeline, output verification for
// event-loop, simulation for git-graph, layout for diagram, caption binding errors.
// Run: node --test tests/unit/visuals-compile.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compileVisual, traceToSpec } from '../../shared/visuals/index.js';
import { compileSamples } from '../../scripts/content/compile-visual-samples.mjs';

const text = (s) => ({ uk: `${s} (uk)`, en: `${s} (en)` });
const ctx = (files = {}) => ({ readFile: async (p) => { if (!(p in files)) throw new Error(`ENOENT ${p}`); return files[p]; }, mdInline: (s) => `<p>${s}</p>`, langs: ['uk', 'en'] });
const messages = (issues) => issues.map((i) => `${i.path}: ${i.message}`).join('\n');

test('all sample blocks compile without issues', async () => {
  const { samples, failures } = await compileSamples();
  assert.deepEqual(failures, []);
  assert.deepEqual(samples.map((s) => s.visual).sort(), ['code-trace', 'diagram', 'event-loop', 'git-graph', 'memory-graph', 'pipeline', 'render-timeline', 'sequence']);
  for (const s of samples) {
    assert.ok(s.spec.steps.length >= 2, s.file);
    for (const step of s.spec.steps) { assert.ok(step.caption.uk && step.caption.en, `${s.file}: every step has a bilingual caption`); }
    JSON.stringify(s.spec); // serializable
  }
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
