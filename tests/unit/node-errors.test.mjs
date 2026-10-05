// What the lesson UI and the content validator read from an isolated Node run (shared/node-run.js):
// the error that ended a run, parsed from what this Node version really prints for an uncaught
// exception; the check results in the learner's terms; the request a block becomes.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { isLearnerSyntaxError, isModuleLinkMessage, nodeRunRequest, parseUncaughtError, testsOutcome, workspaceShortener } from '../../shared/node-run.js';

let dir;
before(() => {
  // A space in the folder name: file URLs percent-encode it, the shortener must still match.
  dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'jsll node errors-')));
  fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}');
});
after(() => fs.rmSync(dir, { recursive: true, force: true }));

/** Run `source` as <dir>/<name> under the permission model, as the executor does; return stderr + status. */
function crash(name, source, extra = {}) {
  for (const [file, text] of Object.entries({ [name]: source, ...extra })) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  }
  const r = spawnSync(process.execPath, ['--permission', `--allow-fs-read=${dir}`, `--allow-fs-write=${dir}`, path.join(dir, name)], { cwd: dir, encoding: 'utf8', env: { NO_COLOR: '1' } });
  return { status: r.status, stderr: r.stderr, error: parseUncaughtError(r.stderr, dir) };
}
const pick = (e) => e && Object.fromEntries(['name', 'message', 'code', 'file', 'line', 'kind'].filter((k) => e[k] !== undefined).map((k) => [k, e[k]]));

test('runtime errors: name, message and the learner file and line, from the first frame in the exercise', () => {
  assert.deepEqual(pick(crash('ref.js', 'console.log("before");\nconsole.log(missing);\n').error), { name: 'ReferenceError', message: 'missing is not defined', file: 'ref.js', line: 2 });
  assert.deepEqual(pick(crash('async.js', 'setTimeout(() => { null.x; }, 1);\n').error), { name: 'TypeError', message: "Cannot read properties of null (reading 'x')", file: 'async.js', line: 1 });
  assert.deepEqual(pick(crash('custom.js', 'class ValidationError extends Error { constructor(m) { super(m); this.name = "ValidationError"; } }\nthrow new ValidationError("bad input");\n').error), { name: 'ValidationError', message: 'bad input', file: 'custom.js', line: 2 });
  const multi = crash('multi.js', 'throw new Error("first line\\nsecond line");\n').error;
  assert.equal(multi.message, 'first line\nsecond line');
  const json = crash('lib/parse.js', 'JSON.parse("{bad");\n').error;
  assert.deepEqual(pick(json), { name: 'SyntaxError', message: json.message, file: 'lib/parse.js', line: 1 });
  assert.equal(json.kind, undefined, 'a JSON.parse error is a runtime error, not a parse error of the code');
});

test('parse errors of the code are "syntax" with the location of the bad token, also in an imported file', () => {
  const own = crash('syn.js', 'console.log("a");\nconsole.log(;\n').error;
  assert.deepEqual(pick(own), { name: 'SyntaxError', message: "Unexpected token ';'", file: 'syn.js', line: 2, kind: 'syntax' });
  assert.equal(own.frame, 'console.log(;\n            ^');
  assert.deepEqual(pick(crash('nested.js', 'import "./broken.js";\n', { 'broken.js': 'export const x = ;\n' }).error), { name: 'SyntaxError', message: "Unexpected token ';'", file: 'broken.js', line: 1, kind: 'syntax' });
  // A missing export is a link problem: no "syntax" kind, so it is not shown as unreadable code.
  const link = crash('link.js', 'import { nope } from "./other.js";\n', { 'other.js': 'export const a = 1;\n' }).error;
  assert.deepEqual(pick(link), { name: 'SyntaxError', message: "The requested module './other.js' does not provide an export named 'nope'", file: 'link.js', line: 1 });
  // A named import of a CommonJS module that Node cannot detect: also a link problem. Node 22 prints
  // "Named export … not found" wherever the import sits; Node 25 only for an import in the entry file.
  const cjs = crash('cjs-entry.js', 'import { hidden } from "./lib.cjs";\n', { 'lib.cjs': 'module.exports = {}; Object.assign(module.exports, { hidden: 4 });\n' }).error;
  assert.equal(cjs.name, 'SyntaxError');
  assert.match(cjs.message, /^Named export 'hidden' not found\. The requested module '\.\/lib\.cjs' is a CommonJS module/);
  assert.equal(cjs.kind, undefined, 'a CommonJS named import is not unreadable code');
});

test('module-link messages in both of Node\'s wordings (22.13.1, 22.23.3, 25.2.1)', () => {
  assert.equal(isModuleLinkMessage("The requested module './a.js' does not provide an export named 'b'"), true);
  assert.equal(isModuleLinkMessage("Named export 'b' not found. The requested module './a.cjs' is a CommonJS module, which may not support all module.exports as named exports.\nCommonJS modules can always be imported via the default export, for example using:"), true);
  assert.equal(isModuleLinkMessage("Unexpected token ';'"), false);
  assert.equal(isModuleLinkMessage(undefined), false);
  const named = "Named export 'hidden' not found. The requested module './lib.cjs' is a CommonJS module, which may not support all module.exports as named exports.";
  assert.equal(isLearnerSyntaxError({ name: 'SyntaxError', message: named, file: 'index.js' }), false, 'the code could start: an import asks for a name');
});

test('errors with a code keep it, and paths inside the exercise are shown relative to it', () => {
  const denied = crash('read.js', 'import fs from "node:fs";\nfs.readFileSync("/etc/hosts");\n').error;
  assert.deepEqual(pick(denied), { name: 'Error', message: 'Access to this API has been restricted. Use --allow-fs-read to manage permissions.', code: 'ERR_ACCESS_DENIED', file: 'read.js', line: 2 });
  assert.match(denied.frame, /resource: '\/etc\/hosts'/);
  const missing = crash('imp.js', 'import "./lib/missing.js";\n').error;
  assert.deepEqual(pick(missing), { name: 'Error', message: "Cannot find module 'lib/missing.js' imported from imp.js", code: 'ERR_MODULE_NOT_FOUND' });
  assert.ok(!missing.stack.includes(dir) && !missing.message.includes(dir), 'no machine paths of the exercise folder are shown');
});

test('non-Error throws and exits without an uncaught error', () => {
  assert.deepEqual(pick(crash('str.js', 'throw "plain";\n').error), { name: 'Error', message: 'plain' });
  const rejected = crash('rej.js', 'Promise.reject("bare reason");\n').error;
  assert.equal(rejected.code, 'ERR_UNHANDLED_REJECTION');
  const exit = crash('exit.js', 'console.error("oops"); process.exit(2);\n');
  assert.deepEqual([exit.status, exit.error], [2, null], 'process.exit is not an uncaught error');
  assert.equal(parseUncaughtError('', dir), null);
});

test('check results: load errors first and marked, parse errors in learner files recognized, paths shortened', () => {
  const shorten = workspaceShortener('/tmp/run 1');
  const outcome = testsOutcome({
    results: [{ name: 'a', status: 'fail', message: 'at file:///tmp/run%201/app.js:3:1', errorName: 'ReferenceError', ms: 3 }],
    loadError: { name: 'TimeoutError', message: 'aborted' },
    errors: [{ name: 'RangeError', message: 'later', phase: 'idle' }, { name: 'ReferenceError', message: 'item is not defined', phase: 'load', file: 'app.js', line: 6 }],
  }, shorten);
  assert.deepEqual(outcome.results, [{ name: 'a', status: 'fail', message: 'at app.js:3:1', errorName: 'ReferenceError', ms: 3 }]);
  assert.deepEqual(outcome.errors.map((e) => [e.name, e.atLoad === true]), [['ReferenceError', true], ['TimeoutError', true], ['RangeError', false]]);
  assert.equal(isLearnerSyntaxError({ name: 'SyntaxError', message: "Unexpected token ';'", file: 'app.js' }), true);
  assert.equal(isLearnerSyntaxError({ name: 'SyntaxError', message: 'x', file: '__tests__.js' }), false, 'an error in the checks is not the learner\'s');
  assert.equal(isLearnerSyntaxError({ name: 'SyntaxError', message: "The requested module './a.js' does not provide an export named 'b'", file: 'app.js' }), false);
});

test('a block becomes the executor request: capabilities one to one, checks with the strings as L', () => {
  const block = { entry: 'index.js', tests: 'test("x", () => {});', capabilities: { network: 'loopback', timeoutMs: 5000, testTimeoutMs: 3000 }, strings: { lamp: { uk: 'Лампа', en: 'Lamp' } } };
  assert.deepEqual(nodeRunRequest(block, { 'index.js': '' }, { mode: 'run', lang: 'en' }), { files: { 'index.js': '' }, entry: 'index.js', mode: 'run', capabilities: { network: 'loopback', workers: false }, timeoutMs: 5000 });
  assert.deepEqual(nodeRunRequest(block, { 'index.js': '' }, { mode: 'test', lang: 'en' }), { files: { 'index.js': '' }, entry: 'index.js', mode: 'test', capabilities: { network: 'loopback', workers: false }, timeoutMs: 5000, tests: { path: '__tests__.js', source: 'test("x", () => {});', timeoutMs: 3000 }, strings: { lamp: 'Lamp' } });
  assert.deepEqual(nodeRunRequest({ entry: 'a.js' }, {}, {}).capabilities, { network: 'none', workers: false });
});
