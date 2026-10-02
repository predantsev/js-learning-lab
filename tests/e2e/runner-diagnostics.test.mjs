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

test('an error carries its cause chain: every level, a value that is not an error, cycles and a depth limit', async () => {
  const err = (name, message) => ({ t: 'error', name, message });
  const thrown = await run({ files: { 'index.js': 'const inner = new TypeError("x is undefined");\nconst middle = new RangeError("bad amount", { cause: inner });\nthrow new Error("the task was not saved", { cause: middle });\n' } });
  assert.equal(thrown.errors.length, 1);
  assert.deepEqual(thrown.errors[0].causes, [err('RangeError', 'bad amount'), err('TypeError', 'x is undefined')]);

  const logged = await run({
    files: {
      'index.js': [
        'console.log(new Error("habit cannot be saved", { cause: ["name is empty"] }));',
        'const a = new Error("a");',
        'const b = new Error("b", { cause: a });',
        'a.cause = b;',
        'console.log(b);',
        'let deep = new Error("level 0");',
        'for (let i = 1; i < 9; i++) deep = new Error("level " + i, { cause: deep });',
        'console.log(deep);',
        'console.log(new Error("no cause"));',
        'console.log(new Error("undefined cause", { cause: undefined }));',
      ].join('\n'),
    },
  });
  const [withValue, cyclic, deep, none, undefinedCause] = logged.console.map((e) => e.args[0]);
  assert.deepEqual(withValue.causes, [{ t: 'array', items: [{ t: 'string', v: 'name is empty', cut: false }], length: 1 }]);
  assert.deepEqual(cyclic.causes, [err('Error', 'a'), { t: 'circular' }]);
  assert.deepEqual(deep.causes, [err('Error', 'level 7'), err('Error', 'level 6'), err('Error', 'level 5'), err('Error', 'level 4'), err('Error', 'level 3'), { t: 'more', name: '…' }]);
  assert.equal(none.causes, undefined);
  assert.deepEqual(undefinedCause.causes, [{ t: 'undefined' }], 'an own cause property is shown even when it is undefined');
});

test('project .json files import with { type: "json" }: statically, re-exported and with import()', async () => {
  const r = await run({
    files: {
      'index.js': [
        'import data from "./data/items.json" with { type: "json" };',
        'import { items } from "./reexport.js";',
        'import plain from "./data/items.json";',
        'console.log(data.items.length, items.items[1], plain === data);',
        'const path = "./data/items.json";',
        'const loaded = await import(path, { with: { type: "json" } });',
        'const literal = await import("./data/items.json", { with: { type: "json" } });',
        'console.log(loaded.default === data, literal.default.items[0]);',
      ].join('\n'),
      'reexport.js': 'export { default as items } from "./data/items.json" with { type: "json" };\n',
      'data/items.json': '{ "items": ["lamp", "plant"] }',
    },
  });
  assert.equal(r.status, 'done');
  assert.deepEqual(r.errors, []);
  // In the sandbox a .json file is one module, with or without the attribute (a browser keeps a JSON
  // module apart from other imports of the same file, and refuses the import without the attribute).
  assert.deepEqual(texts(r), ['2 plant true', 'true lamp']);
});

test('an import attribute that cannot work is refused before running, with the file and the reason', async () => {
  const css = await run({ files: { 'index.js': 'import sheet from "./styles.css" with { type: "css" };\n', 'styles.css': 'p { color: red; }' } });
  assert.equal(css.status, 'compile-error');
  assert.deepEqual([css.compileErrors[0].kind, css.compileErrors[0].code, css.compileErrors[0].file, css.compileErrors[0].line], ['import', 'unsupported-import-type', 'index.js', 1]);
  assert.match(css.compileErrors[0].message, /"\.\/styles\.css" is imported with \{ type: "css" \}/);
  const notJson = await run({ files: { 'index.js': 'import x from "./util.js" with { type: "json" };\n', 'util.js': 'export default 1;' } });
  assert.deepEqual([notJson.compileErrors[0].code, notJson.compileErrors[0].message], ['not-json-module', '"./util.js" is imported with { type: "json" }, but it is not a .json file of the project.']);
});

test('a module graph that fails to load while running is reported as one error, never as silence or a missing frame.html', async () => {
  // Every import is checked before running, so the failures are provoked by changing the prepared run:
  // a specifier the import map does not know, and a module whose fetch fails (HTTP 404).
  const runChanged = (change) => page.evaluate(async (how) => {
    const { prepareRun, runToCompletion, sandboxOriginFor, port } = window.jsll;
    const sandboxOrigin = sandboxOriginFor(port);
    const prepared = prepareRun({ files: { 'index.js': 'console.log("never");\n' }, entry: 'index.js', runtime: 'browser-js', sandboxOrigin });
    if (how === 'unknown-specifier') prepared.payload.modules['index.js'] = 'import "~/gone.js";\nconsole.log("never");\n';
    else {
      prepared.payload.libs['gone-lib'] = `${sandboxOrigin}/sandbox/libs/does-not-exist.js`;
      prepared.payload.modules['index.js'] = 'import "gone-lib";\nconsole.log("never");\n';
    }
    const container = document.createElement('div');
    document.getElementById('stage').append(container);
    return runToCompletion({ container, sandboxOrigin, prepared, visible: false });
  }, change);
  for (const [change, pattern] of [['unknown-specifier', /gone\.js/], ['fetch-fails', /dynamically imported module|module script/]]) {
    const r = await runChanged(change);
    assert.equal(r.status, 'done', change);
    assert.deepEqual(texts(r), [], change);
    assert.deepEqual(r.console.filter((e) => e.level === 'system').map((e) => e.code), [], `${change}: no "missing file frame.html" note`);
    assert.equal(r.errors.length, 1, `${change}: ${JSON.stringify(r.errors)}`);
    assert.equal(r.errors[0].name, 'TypeError', change);
    assert.match(r.errors[0].message, pattern, change);
    assert.doesNotMatch(r.errors[0].message, /~\//, change);
  }
});

test('focus() works in every hidden validator frame: the program starts only once the frame has its size', async () => {
  // Measured before the fix: about 1 run in 6 started in a 0×0 frame, and button.focus() then left
  // document.activeElement on <body>. Thirty runs fail with probability above 99% without the fix.
  const code = 'const sized = innerWidth > 0 && innerHeight > 0;\nconst save = document.createElement("button");\nsave.textContent = "Save";\ndocument.body.append(save);\nsave.focus();\nconsole.log(sized, document.activeElement.tagName);\n';
  const seen = [];
  for (let i = 0; i < 30; i++) {
    const r = await run({ files: { 'index.js': code } });
    seen.push(texts(r).join(' | '));
  }
  assert.deepEqual([...new Set(seen)], ['true BUTTON'], seen.join(', '));
  // An element written in the page itself, as lessons do.
  const html = await run({ entry: 'index.html', files: { 'index.html': '<!doctype html><body><button id="save">Save</button><script type="module" src="./index.js"></script></body>', 'index.js': 'document.querySelector("#save").focus();\nconsole.log(document.activeElement.tagName);\n' } });
  assert.deepEqual(texts(html), ['BUTTON']);
});
