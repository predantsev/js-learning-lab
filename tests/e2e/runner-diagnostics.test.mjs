// What the browser runner tells the learner about their program (issue #7 author reports): stack
// traces and module errors in project terms, console.trace, error causes, module-linking guidance,
// JSON module imports and a deterministic page for focus.
// Run: node --test tests/e2e/runner-diagnostics.test.mjs   (needs `npm run build` first; uses installed Chrome)
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import { startServer } from '../../server/app.mjs';

let server;
let browser;
let page;
let dataDir;

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-diagnostics-'));
  server = await startServer({ port: 0, dataDir, quiet: true });
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  page = await browser.newPage();
  await page.goto(`http://js-learning-lab.localhost:${server.port}/harness.html`);
  await page.waitForFunction(() => document.documentElement.dataset.harness === 'ready');
});

after(async () => {
  await browser?.close();
  await server?.close();
  await fs.rm(dataDir, { recursive: true, force: true });
});

const run = (input) => page.evaluate((i) => window.jsll.runProject(i), { runtime: 'browser-js', entry: 'index.js', ...input });
const texts = (result) => result.console.filter((e) => e.level !== 'system').map((e) => e.args.map((a) => (a.v !== undefined ? String(a.v) : a.t)).join(' '));
const INTERNAL = /Proxy\.|jsll-run-|\/sandbox\/|frame\.html|blob:|~\//;

test('stack traces name project files only: no runtime frames, sandbox URLs or Proxy receivers', async () => {
  const r = await run({
    files: {
      'index.js': 'function formatAmount(n) {\n  console.log(new Error("x").stack);\n  return n;\n}\nformatAmount(1);\nsetTimeout(() => console.log(new Error("timer").stack), 0);\n',
    },
    tests: { path: '__tests__.js', source: 'test("calls formatAmount", () => { expect(scope.formatAmount(2)).toBe(2); });\n' },
  });
  assert.equal(r.status, 'done');
  const stacks = texts(r).filter((line) => line.startsWith('Error: '));
  assert.equal(stacks.length, 3, JSON.stringify(stacks));
  for (const stack of stacks) assert.doesNotMatch(stack, INTERNAL, stack);
  assert.equal(stacks[0], 'Error: x\n    at formatAmount (index.js:2:15)\n    at index.js:5:1');
  assert.equal(stacks[1], 'Error: timer\n    at index.js:6:30', 'a timer callback has no frame of the runtime under it');
  assert.match(stacks[2], /^Error: x\n {4}at formatAmount \(index\.js:2:15\)\n {4}at .*__tests__\.js:1:\d+\)$/, 'a call from a check: the function name without "Proxy.", then the check');
  assert.deepEqual(r.tests.map((t) => t.status), ['pass']);

  // An uncaught error thrown in a timer: the error card's stack has the learner frames only.
  const thrown = await run({ files: { 'index.js': 'function save() {\n  throw new TypeError("no list");\n}\nsetTimeout(() => save(), 0);\n' } });
  assert.equal(thrown.errors.length, 1);
  assert.equal(thrown.errors[0].stack, 'TypeError: no list\n    at save (index.js:2:9)\n    at index.js:4:18');
  assert.deepEqual([thrown.errors[0].file, thrown.errors[0].line], ['index.js', 2]);

  // A classic inline script of a page is named after the page; the runtime that wrote the page is not shown.
  const page2 = await run({ entry: 'index.html', files: { 'index.html': '<!doctype html><body><script>\nfunction f() { console.log(new Error("inline").stack); }\nf();\n</script></body>' } });
  assert.deepEqual(texts(page2), ['Error: inline\n    at f (index.html.inline-1.js:2:27)\n    at index.html.inline-1.js:3:1']);
});

test('a missing export names the project file, in the error card and wherever learner code reads the message', async () => {
  const records = 'export const isValid = (x) => x !== null;\n';
  const r = await run({ files: { 'index.js': 'import { isvalid } from "./records.js";\nconsole.log(isvalid(1));\n', 'records.js': records } });
  assert.equal(r.errors.length, 1);
  assert.equal(r.errors[0].name, 'SyntaxError');
  assert.equal(r.errors[0].message, "The requested module 'records.js' does not provide an export named 'isvalid'");
  assert.equal(r.errors[0].stack, "SyntaxError: The requested module 'records.js' does not provide an export named 'isvalid'");

  // A page whose classic script listens for errors, then loads the broken module graph.
  const listened = await run({
    entry: 'index.html',
    files: {
      'index.html': '<!doctype html><body><script>addEventListener("error", (event) => console.log("caught:", event.error.message));</script><script type="module" src="./index.js"></script></body>',
      'index.js': 'import { isvalid } from "./records.js";\n',
      'records.js': records,
    },
  });
  assert.deepEqual(texts(listened), ["caught: The requested module 'records.js' does not provide an export named 'isvalid'"]);

  // import() that fails: the caught error says the same, and so does a variable path to a missing file.
  const dynamic = await run({
    files: {
      'index.js': 'import("./app.js").catch((error) => console.log(error.name, error.message));\nconst path = "./missing.js";\nimport(path).catch((error) => console.log(error.name, error.message));\n',
      'app.js': 'import { isvalid } from "./records.js";\n',
      'records.js': records,
    },
  });
  const lines = texts(dynamic).sort();
  assert.deepEqual(lines, ["SyntaxError The requested module 'records.js' does not provide an export named 'isvalid'", "TypeError Failed to resolve module specifier 'missing.js'"]);
  for (const line of lines) assert.doesNotMatch(line, INTERNAL);
});

test('console.trace reaches the console with its arguments and project-path stack; checks read it from rawLogs, not logs', async () => {
  const r = await run({
    files: {
      'index.js': 'function formatAmount(n) {\n  console.trace();\n  console.trace("amount", n);\n  return n + " UAH";\n}\nfunction formatRow(e) {\n  return e.label + ": " + formatAmount(e.amount);\n}\nconsole.log(formatRow({ label: "Lunch", amount: 210 }));\n',
    },
    tests: {
      path: '__tests__.js',
      source: [
        'test("printed text is what log printed", () => { expect(logs()).toEqual(["Lunch: 210 UAH"]); });',
        'test("traces are in rawLogs with their stack", () => {',
        '  const traces = rawLogs().filter((c) => c.level === "trace");',
        '  expect(traces.map((c) => c.args)).toEqual([[], ["amount", 210]]);',
        '  expect(traces[0].stack).toBe("at formatAmount (index.js:2:11)\\nat formatRow (index.js:7:27)\\nat index.js:9:13");',
        '});',
      ].join('\n'),
    },
  });
  assert.equal(r.status, 'done');
  assert.deepEqual(r.tests.map((t) => [t.name, t.status, t.message ?? '']), [['printed text is what log printed', 'pass', ''], ['traces are in rawLogs with their stack', 'pass', '']]);
  const traces = r.console.filter((e) => e.level === 'trace');
  assert.equal(traces.length, 2);
  assert.deepEqual(traces[0].args, []);
  assert.deepEqual(traces[1].args.map((a) => a.v), ['amount', 210]);
  assert.equal(traces[0].stack, 'at formatAmount (index.js:2:11)\nat formatRow (index.js:7:27)\nat index.js:9:13');
  assert.equal(traces[1].stack, 'at formatAmount (index.js:3:11)\nat formatRow (index.js:7:27)\nat index.js:9:13');
  assert.deepEqual(r.console.filter((e) => e.level !== 'system').map((e) => e.level), ['trace', 'trace', 'log'], 'in the order the program printed them');
});
