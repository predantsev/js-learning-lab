// Static validation of visual specs (shared/visuals/index.js validateVisualSpec).
// Run: node --test tests/unit/visuals-validate.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { VISUAL_KINDS, VISUAL_SCHEMAS, validateVisualSpec } from '../../shared/visuals/index.js';

const text = { uk: 'укр', en: 'en' };
const paths = (issues) => issues.map((i) => i.path);

test('every kind has a schema description and rejects a non-object spec', () => {
  assert.deepEqual(Object.keys(VISUAL_SCHEMAS).sort(), [...VISUAL_KINDS].sort());
  for (const kind of VISUAL_KINDS) {
    assert.equal(typeof VISUAL_SCHEMAS[kind].summary, 'string');
    assert.ok(validateVisualSpec(kind, 'nope').length > 0, kind);
  }
  assert.match(validateVisualSpec('mystery', {})[0].message, /unknown visual kind/);
});

test('code-trace: file or code, captions bound by line/hit or step, no imports', () => {
  assert.deepEqual(paths(validateVisualSpec('code-trace', { file: 'x.js', captions: [{ at: { line: 1 }, text }] })), []);
  const issues = validateVisualSpec('code-trace', { file: 'x.ts', code: 'let a', steps: 'some', maxSteps: 1, captions: [{ at: { line: 0, hit: 0 }, text: { uk: 'a' } }, { at: { step: 2, line: 1 }, text }, { at: {} }] });
  assert.ok(paths(issues).includes('spec'), 'file and code together');
  assert.ok(paths(issues).includes('spec.file'), '.ts rejected');
  assert.ok(paths(issues).includes('spec.steps'));
  assert.ok(paths(issues).includes('spec.maxSteps'));
  assert.ok(paths(issues).includes('spec.captions[0].at.line'));
  assert.ok(paths(issues).includes('spec.captions[0].at.hit'));
  assert.ok(paths(issues).includes('spec.captions[0].text.en'));
  assert.ok(paths(issues).includes('spec.captions[1].at'), 'line and step together');
  assert.ok(paths(issues).includes('spec.captions[2].at.line'));
  assert.ok(paths(issues).includes('spec.captions[2].text'));
  assert.ok(paths(validateVisualSpec('code-trace', { code: 'import x from "./x.js";', captions: [{ at: { line: 1 }, text }] })).includes('spec.code'));
});

test('memory-graph: heap ids, refs and inline objects', () => {
  const ok = { states: [{ caption: text, bindings: [{ name: 'a', value: { ref: 'o' } }, { name: 'n', value: 5 }], heap: { o: { kind: 'object', props: { x: 1 } } } }] };
  assert.deepEqual(validateVisualSpec('memory-graph', ok), []);
  const issues = validateVisualSpec('memory-graph', { states: [{ caption: text, bindings: [{ name: 'a', value: { ref: 'missing' } }, { name: 'a', value: { x: 1 } }, { name: 'b' }], heap: { o: { kind: 'blob' } }, changed: ['zzz'] }] });
  assert.ok(paths(issues).includes('spec.states[0].bindings[0].value'), 'unknown ref');
  assert.ok(paths(issues).includes('spec.states[0].bindings[1].name'), 'duplicate');
  assert.ok(paths(issues).includes('spec.states[0].bindings[1].value'), 'inline object');
  assert.ok(paths(issues).includes('spec.states[0].bindings[2].value'), 'missing value');
  assert.ok(paths(issues).includes('spec.states[0].heap.o.kind'));
  assert.ok(paths(issues).includes('spec.states[0].changed'));
  assert.ok(paths(validateVisualSpec('memory-graph', { from: 'trace', file: 'a.js', captions: [{ at: { line: 1 }, text }] })).length === 0);
});

test('pipeline: ops, function sources, perItem needs summary, reduce needs initial', () => {
  const base = { input: { label: text, caption: text, items: [1, 2] }, stages: [{ op: 'filter', fn: 'x => x > 1', caption: text }] };
  assert.deepEqual(validateVisualSpec('pipeline', base), []);
  const issues = validateVisualSpec('pipeline', { input: { label: text, caption: text, items: [] }, stages: [{ op: 'zip', fn: 'nope', caption: text }, { op: 'reduce', fn: '(a, b) => a + b', caption: text, perItem: true }, { op: 'sort', fn: '(a, b) => a - b', caption: text, perItem: true, summary: text }] });
  assert.ok(paths(issues).includes('spec.input.items'));
  assert.ok(paths(issues).includes('spec.stages[0].op'));
  assert.ok(paths(issues).includes('spec.stages[0].fn'));
  assert.ok(paths(issues).includes('spec.stages[1].summary'));
  assert.ok(paths(issues).includes('spec.stages[1].initial'));
  assert.ok(paths(issues).includes('spec.stages[2].perItem'));
  // New stages and fields: some/every/toSorted, perComparison, throws, bilingual show.
  const fine = validateVisualSpec('pipeline', { input: { label: text, caption: text, items: [1], show: { uk: 'x => `${x} грн`', en: 'x => `€${x}`' } }, stages: [{ op: 'toSorted', fn: '(a, b) => a - b', perComparison: true, caption: text, summary: text }, { op: 'some', fn: 'x => x > 1', caption: text, throws: false }, { op: 'every', fn: 'x => x', caption: text }] });
  assert.deepEqual(fine, []);
  const wrong = validateVisualSpec('pipeline', { input: { label: text, caption: text, items: [1], show: { uk: 'x => x' } }, stages: [{ op: 'filter', fn: 'x => x', caption: text, perComparison: true }, { op: 'toSorted', fn: '(a, b) => a - b', caption: text, perItem: true, summary: text }, { op: 'sort', fn: '(a, b) => a - b', caption: text, perComparison: true }, { op: 'map', fn: 'x => x', caption: text, throws: 'yes' }] });
  assert.ok(paths(wrong).includes('spec.input.show'), 'a bilingual show needs both languages');
  assert.ok(paths(wrong).includes('spec.stages[0].perComparison'), 'only sorts have comparisons');
  assert.ok(paths(wrong).includes('spec.stages[1].perItem'), 'toSorted is not per item either');
  assert.ok(paths(wrong).includes('spec.stages[2].summary'), 'perComparison needs a summary');
  assert.ok(paths(wrong).includes('spec.stages[3].throws'));
});

test('event-loop: steps list the stack, queues are string lists', () => {
  assert.deepEqual(validateVisualSpec('event-loop', { code: 'console.log(1)', steps: [{ caption: text, stack: ['script'] }, { caption: text, stack: [], log: '1' }] }), []);
  assert.ok(paths(validateVisualSpec('event-loop', { code: 'x', steps: [{ caption: text, stack: [] }] })).includes('spec.steps'), 'at least two steps');
  const issues = validateVisualSpec('event-loop', { code: 'x', steps: [{ caption: text, microtasks: 'then' }, { caption: text, stack: [] }] });
  assert.ok(paths(issues).includes('spec.steps[0].stack'));
  assert.ok(paths(issues).includes('spec.steps[0].microtasks'));
});

test('diagram: ids, groups, edges, hidden/show consistency', () => {
  const ok = { groups: [{ id: 'g', label: text }], nodes: [{ id: 'a', label: 'A', group: 'g' }, { id: 'b', label: text }], edges: [{ from: 'a', to: 'b', label: 'x' }], hidden: ['b'], steps: [{ caption: text, highlight: ['a'] }, { caption: text, show: ['b'], annotate: [{ id: 'a->b', text }] }] };
  assert.deepEqual(validateVisualSpec('diagram', ok), []);
  const issues = validateVisualSpec('diagram', { layout: 'grid', nodes: [{ id: 'a', label: 'A', group: 'nope', shape: 'star' }, { id: 'a', label: 'B' }], edges: [{ from: 'a', to: 'zz' }], hidden: ['a'], steps: [{ caption: text, highlight: ['q'], show: ['zz'] }] });
  assert.ok(paths(issues).includes('spec.nodes[0].group'));
  assert.ok(paths(issues).includes('spec.nodes[0].shape'));
  assert.ok(paths(issues).includes('spec.nodes[0]'), 'grid needs col/row');
  assert.ok(paths(issues).includes('spec.nodes[1].id'), 'duplicate');
  assert.ok(paths(issues).includes('spec.edges[0].to'));
  assert.ok(paths(issues).includes('spec.steps[0].highlight'));
  assert.ok(paths(issues).includes('spec.hidden'), 'hidden but never shown');
});

test('sequence: actors, message endpoints, notes to self', () => {
  const ok = { actors: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], messages: [{ from: 'a', to: 'b', label: 'hi', caption: text }, { from: 'b', to: 'b', kind: 'note', label: 'think', caption: text }] };
  assert.deepEqual(validateVisualSpec('sequence', ok), []);
  const issues = validateVisualSpec('sequence', { actors: [{ id: 'a', label: 'A' }], messages: [{ from: 'a', to: 'a', label: 'x', caption: text, kind: 'wave' }] });
  assert.ok(paths(issues).includes('spec.actors'), 'two actors minimum');
  assert.ok(paths(issues).includes('spec.messages[0].kind'));
  assert.ok(paths(issues).includes('spec.messages[0]'), 'self message must be a note');
});

test('git-graph: first step is init, each op has its fields', () => {
  const issues = validateVisualSpec('git-graph', { steps: [{ op: 'commit', caption: text }, { op: 'branch', caption: text }, { op: 'merge', caption: text }, { op: 'reset', to: 'c1', mode: 'wild', caption: text }, { op: 'stage', files: [], caption: text }] });
  assert.ok(paths(issues).includes('spec.steps[0].op'), 'must start with init');
  assert.ok(paths(issues).includes('spec.steps[0].message'));
  assert.ok(paths(issues).includes('spec.steps[1].name'));
  assert.ok(paths(issues).includes('spec.steps[2].from'));
  assert.ok(paths(issues).includes('spec.steps[3].mode'));
  assert.ok(paths(issues).includes('spec.steps[4].files'));
  assert.deepEqual(validateVisualSpec('git-graph', { steps: [{ op: 'init', caption: text }, { op: 'commit', message: 'm', caption: text }] }), []);
});

test('render-timeline: numbered renders, phase fields', () => {
  const ok = { code: 'a\nb', steps: [{ phase: 'render', render: 1, reason: text, snapshot: { state: { n: 0 } }, caption: text, line: 2 }, { phase: 'commit', render: 1, dom: 'x', caption: text }, { phase: 'event', name: 'click', sees: { n: 0 }, actions: ['setN(1)'], caption: text }, { phase: 'render', render: 2, reason: text, snapshot: { state: { n: 1 } }, caption: text }] };
  assert.deepEqual(validateVisualSpec('render-timeline', ok), []);
  const issues = validateVisualSpec('render-timeline', { code: 'a', steps: [{ phase: 'render', render: 2, caption: text, snapshot: {}, line: 5 }, { phase: 'effect', render: 1, caption: text }, { phase: 'event', caption: text }] });
  assert.ok(paths(issues).includes('spec.steps[0].render'), 'renders numbered from 1');
  assert.ok(paths(issues).includes('spec.steps[0].reason'));
  assert.ok(paths(issues).includes('spec.steps[0].snapshot'));
  assert.ok(paths(issues).includes('spec.steps[0].line'));
  assert.ok(paths(issues).includes('spec.steps[1].render'));
  assert.ok(paths(issues).includes('spec.steps[1]'), 'effect needs run or cleanup');
  assert.ok(paths(issues).includes('spec.steps[2].name'));
  assert.ok(paths(issues).includes('spec.steps[2].actions'));
});
