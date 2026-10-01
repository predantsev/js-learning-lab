// Execution tracer: steps come from real execution (shared/visuals/tracer.js + sandbox/trace-runtime.js).
// Run: node --test tests/unit/visuals-tracer.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runTraced } from '../../shared/visuals/exec-node.js';

const run = async (source, options = {}) => {
  const result = await runTraced(source, { file: 'test.js', ...options });
  assert.ok(result.trace, `tracer failed: ${JSON.stringify(result.error)}`);
  return result;
};
/** Flattened name → value for the scope chain of a step (innermost wins). */
const varsOf = (step) => {
  const out = {};
  let id = step.scope;
  const seen = new Set();
  while (id && step.scopes[id] && !seen.has(id)) {
    seen.add(id);
    for (const v of step.scopes[id].vars) if (!(v.name in out)) out[v.name] = v.uninit ? 'UNINIT' : v.value.t === 'ref' ? `ref:${v.value.id}` : v.value.v ?? v.value.t;
    id = step.scopes[id].parent;
  }
  return out;
};
const stepsAt = (trace, line, kind = null) => trace.steps.filter((s) => s.line === line && (kind === null || s.kind === kind));

test('statements produce steps in execution order with the state before each line', async () => {
  const { trace } = await run('let a = 1;\nlet b = a + 1;\nconsole.log(a, b);\n');
  assert.deepEqual(trace.steps.map((s) => [s.line, s.kind]), [[1, 'stmt'], [2, 'stmt'], [3, 'stmt'], [3, 'end']]);
  assert.deepEqual(varsOf(trace.steps[0]), { a: 'UNINIT', b: 'UNINIT' });
  assert.deepEqual(varsOf(trace.steps[1]), { a: 1, b: 'UNINIT' });
  assert.deepEqual(varsOf(trace.steps[2]), { a: 1, b: 2 });
  assert.deepEqual(trace.console, [{ step: 2, level: 'log', text: '1 2' }]);
  assert.equal(trace.truncated, false);
  assert.equal(trace.error, null);
});

test('loops produce one step per iteration and per-iteration let bindings are distinct scope instances', async () => {
  const { trace } = await run('const fns = [];\nfor (let i = 0; i < 3; i++) {\n  fns.push(() => i);\n}\nconsole.log(fns.map((f) => f()).join(","));\n');
  const conds = stepsAt(trace, 2, 'cond');
  assert.equal(conds.length, 4, 'three iterations plus the final failing test');
  assert.deepEqual(conds.map((s) => varsOf(s).i), [0, 1, 2, 3]);
  const bodies = stepsAt(trace, 3, 'stmt');
  assert.equal(bodies.length, 3);
  const loopScopeIds = bodies.map((s) => { let id = s.scope; while (id && s.scopes[id].kind !== 'loop') id = s.scopes[id].parent; return id; });
  assert.equal(new Set(loopScopeIds).size, 3, 'each iteration gets its own loop scope instance');
  assert.equal(trace.console.at(-1).text, '0,1,2');
  // The closures created in the body remember their own iteration scope.
  const last = trace.steps.at(-1);
  const fnEntries = Object.values(last.heap).filter((h) => h.t === 'function' && h.name === '');
  assert.ok(fnEntries.length >= 1);
});

test('closures: a captured scope stays visible with live values after the outer function returned', async () => {
  const src = 'function make(start) {\n  let count = start;\n  return function inc() {\n    count += 1;\n    return count;\n  };\n}\nconst inc = make(10);\ninc();\ninc();\n';
  const { trace } = await run(src);
  const insideSecondCall = stepsAt(trace, 5, 'return')[1];
  assert.ok(insideSecondCall, 'second return step');
  const chain = [];
  let id = insideSecondCall.scope;
  while (id) { chain.push(insideSecondCall.scopes[id]); id = insideSecondCall.scopes[id].parent; }
  assert.deepEqual(chain.map((s) => s.kind), ['function', 'function', 'module']);
  assert.equal(chain[1].name, 'make');
  assert.equal(chain[1].vars.find((v) => v.name === 'count').value.v, 12);
  assert.deepEqual(insideSecondCall.frames.map((f) => f.name), ['test.js', 'inc']);
  // Heap: the function value carries the scope it was created in.
  const fn = Object.values(insideSecondCall.heap).find((h) => h.t === 'function' && h.name === 'inc');
  assert.equal(fn.scope, chain[1].id);
  assert.equal(insideSecondCall.event.type, 'return');
  assert.equal(insideSecondCall.event.value.v, 12);
});

test('temporal dead zone: let/const/class show as uninitialized until their line runs', async () => {
  const { trace } = await run('console.log("a");\nlet x = 1;\n{\n  console.log("b");\n  const y = 2;\n  class K {}\n  console.log(y);\n}\n');
  assert.equal(varsOf(trace.steps[0]).x, 'UNINIT');
  const inBlock = stepsAt(trace, 4, 'stmt')[0];
  assert.equal(varsOf(inBlock).y, 'UNINIT');
  assert.equal(varsOf(inBlock).K, 'UNINIT');
  assert.equal(varsOf(inBlock).x, 1);
  const after = stepsAt(trace, 7, 'stmt')[0];
  assert.equal(varsOf(after).y, 2);
  assert.ok(String(varsOf(after).K).startsWith('ref:'), 'the class line has run');
});

test('shared references: two bindings to one object share a heap id; a copy gets another', async () => {
  const { trace } = await run('const a = { n: 1 };\nconst b = a;\nconst c = { ...a };\nb.n = 2;\nconsole.log(a.n, c.n);\n');
  const atLine4 = stepsAt(trace, 4, 'stmt')[0];
  const v = varsOf(atLine4);
  assert.equal(v.a, v.b);
  assert.notEqual(v.a, v.c);
  const end = trace.steps.at(-1);
  const idA = varsOf(end).a.slice(4);
  assert.deepEqual(end.heap[idA].props, [['n', { t: 'number', v: 2 }]]);
  assert.equal(trace.console[0].text, '2 1');
});

test('exceptions: a throw inside a function is recorded, caught by the caller, and an uncaught one ends the trace', async () => {
  const { trace, error } = await run('function boom() {\n  throw new TypeError("nope");\n}\ntry {\n  boom();\n} catch (e) {\n  console.log("caught", e.message);\n}\nboom();\n');
  const throws = trace.steps.filter((s) => s.kind === 'throw');
  assert.equal(throws.length, 2);
  assert.equal(throws[0].event.error.message, 'nope');
  assert.equal(throws[0].event.uncaught, undefined);
  assert.equal(throws[1].event.uncaught, true);
  assert.equal(trace.console[0].text, 'caught nope');
  assert.equal(error.name, 'TypeError');
  assert.equal(trace.error.name, 'TypeError');
  const catchStep = stepsAt(trace, 7, 'stmt')[0];
  assert.equal(catchStep.scopes[catchStep.scope].kind, 'catch');
  assert.equal(varsOf(catchStep).e.startsWith('ref:'), true);
});

test('the step cap stops tracing cleanly and marks the trace as truncated', async () => {
  const { trace } = await run('let n = 0;\nfor (let i = 0; i < 1000; i++) {\n  n += i;\n}\nconsole.log(n);\n', { maxSteps: 50 });
  assert.equal(trace.steps.length, 50);
  assert.equal(trace.truncated, true);
  assert.equal(trace.console[0].text, '499500', 'the program still ran to completion');
});

test('call stack and arguments: recursion shows one frame per call with its own scope', async () => {
  const { trace } = await run('function fact(n) {\n  if (n <= 1) return 1;\n  return n * fact(n - 1);\n}\nconsole.log(fact(3));\n');
  const calls = trace.steps.filter((s) => s.kind === 'call');
  assert.deepEqual(calls.map((s) => s.event.args[0].value.v), [3, 2, 1]);
  assert.equal(calls[2].frames.length, 4, 'module + three fact frames');
  const returns = trace.steps.filter((s) => s.kind === 'return');
  assert.deepEqual(returns.map((s) => s.event.value.v), [1, 2, 6]);
  assert.equal(trace.console[0].text, '6');
});

test('async: timers and promise callbacks append steps after the module finished', async () => {
  const { trace } = await run('setTimeout(() => {\n  console.log("timer");\n}, 0);\nPromise.resolve().then(() => {\n  console.log("micro");\n});\nconsole.log("sync");\n');
  assert.deepEqual(trace.console.map((c) => c.text), ['sync', 'micro', 'timer']);
  const endIndex = trace.steps.findIndex((s) => s.kind === 'end');
  assert.ok(endIndex !== -1 && endIndex < trace.steps.length - 1, 'callbacks run after the end step');
  assert.deepEqual(trace.steps.slice(endIndex + 1).filter((s) => s.kind === 'call').map((s) => s.event.name), ['then callback', '(anonymous)']);
});

test('a syntax error is reported as a compile error, not a trace', async () => {
  const result = await runTraced('let = ;', { file: 'bad.js' });
  assert.equal(result.trace, null);
  assert.equal(result.error.phase, 'compile');
});

test('an infinite loop is stopped by the loop budget', async () => {
  const result = await runTraced('let i = 0;\nwhile (true) { i++; }\n', { file: 'loop.js', loopBudgetMs: 150, maxSteps: 20 });
  assert.equal(result.error.name, 'LoopBudgetError');
  assert.equal(result.trace.truncated, true);
});
