// Checks of the review: comments that point at real lines and at the PR's four problems, a decision
// record that keeps R1, a runbook in the right order, and your conflict test run against the PR's
// sync.js and against a sync.js that keeps R1 (written here, never shown in the exercise).
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { comments, decision, runbook } from './review.js';

const PR_FILES = ['sync.js', 'server.js', 'http-helpers.js', 'tasks-store.js', 'sync.test.js'];
const lines = {};
for (const file of PR_FILES) lines[file] = (await readFile(file, 'utf8')).split('\n');
const lineOf = (file, text) => lines[file].findIndex((line) => line.includes(text)) + 1;
const list = Array.isArray(comments) ? comments : [];
const near = (comment, file, line, by) => comment?.file === file && Math.abs(comment.line - line) <= by;
const findComment = (kind, places) => list.find((c) => c?.kind === kind && c.severity === 'blocking' && places.some(([file, line, by]) => near(c, file, line, by)));
const longEnough = (text, n) => typeof text === 'string' && text.trim().length >= n;

test('every comment points at an existing line of a PR file and has a kind, a severity and a reason', () => {
  expect(list.length >= 4, 'at least four comments').toBe(true);
  for (const [i, c] of list.entries()) {
    expect(PR_FILES.includes(c?.file), `file of comment ${i + 1} (${c?.file}) is a PR file`).toBe(true);
    expect(Number.isInteger(c.line) && c.line >= 1 && c.line <= lines[c.file].length, `line ${c.line} of comment ${i + 1} exists in ${c.file}`).toBe(true);
    expect(['correctness', 'security', 'operability'].includes(c.kind), `kind of comment ${i + 1}`).toBe(true);
    expect(['blocking', 'suggestion'].includes(c.severity), `severity of comment ${i + 1}`).toBe(true);
    expect(longEnough(c.text, 40), `text of comment ${i + 1} has at least 40 characters`).toBe(true);
  }
});

test('a blocking correctness comment points at the comparison of device clocks', () => {
  const line = lineOf('sync.js', 'change.editedAt >= task.editedAt');
  expect(findComment('correctness', [['sync.js', line, 1]]) !== undefined, `a blocking correctness comment on sync.js:${line} (±1)`).toBe(true);
});

test('a blocking security comment points at the request read without size or count limits', () => {
  const read = lineOf('sync.js', 'await readJson(request)');
  const loop = lineOf('sync.js', 'for (const change of changes)');
  expect(findComment('security', [['sync.js', read, 1], ['sync.js', loop, 0]]) !== undefined, `a blocking security comment on sync.js:${read} (±1) or sync.js:${loop}`).toBe(true);
});

test('a blocking security comment points at the fields copied without validation', () => {
  const line = lineOf('sync.js', 'Object.assign(task, change.fields)');
  expect(findComment('security', [['sync.js', line, 1]]) !== undefined, `a blocking security comment on sync.js:${line} (±1)`).toBe(true);
});

test('an operability comment points at the sync route that cannot be switched off', () => {
  const route = lineOf('server.js', "'POST /sync'");
  const factory = lineOf('sync.js', 'export function createSyncRoute');
  const found = list.find((c) => c?.kind === 'operability' && (near(c, 'server.js', route, 1) || near(c, 'sync.js', factory, 1)));
  expect(found !== undefined, `an operability comment on server.js:${route} (±1) or sync.js:${factory} (±1)`).toBe(true);
});

const STRATEGIES = ['client-clock-last-write-wins', 'server-time-last-write-wins', 'field-merge', 'server-version-check'];
const options = Array.isArray(decision?.options) ? decision.options : [];

test('the decision compares the PR strategy with another one and states consequences', () => {
  expect(longEnough(decision?.context, 40), 'context has at least 40 characters').toBe(true);
  expect(options.length >= 2, 'at least two options').toBe(true);
  for (const option of options) {
    expect(STRATEGIES.includes(option?.strategy), `strategy "${option?.strategy}" is an id from strategies.js`).toBe(true);
    expect(longEnough(option.consequences, 40), `consequences of ${option.strategy} have at least 40 characters`).toBe(true);
  }
  expect(options.some((option) => option?.strategy === 'client-clock-last-write-wins'), 'the PR strategy is one of the options').toBe(true);
});

test('the decision chooses a strategy that keeps R1', () => {
  expect(options.some((option) => option?.strategy === decision?.choice), 'the choice is one of the options').toBe(true);
  expect(decision.choice, 'the chosen strategy').toBe('server-version-check');
  expect(longEnough(decision.consequences, 40), 'consequences of the choice have at least 40 characters').toBe(true);
});

const steps = Array.isArray(runbook?.steps) ? runbook.steps : [];
const firstAction = steps.findIndex((step) => step?.kind === 'action');

test('the runbook starts from a signal and checks, also the data, before it acts', () => {
  expect(longEnough(runbook?.signal, 20), 'signal has at least 20 characters').toBe(true);
  expect(firstAction > 0, 'there is an action, and it is not the first step').toBe(true);
  const before = steps.slice(0, firstAction).map((step) => step?.kind);
  expect(before.includes('check'), 'a check before the first action').toBe(true);
  expect(before.includes('data-check'), 'a data check before the first action').toBe(true);
});

test('an action of the runbook switches sync off with SYNC_ENABLED=false', () => {
  expect(steps.some((step) => step?.kind === 'action' && String(step.text).includes('SYNC_ENABLED=false')), 'an action that names SYNC_ENABLED=false').toBe(true);
});

test('the runbook ends with a confirmation that names 503', () => {
  const last = steps.at(-1);
  expect(last?.kind, 'kind of the last step').toBe('confirm');
  expect(String(last?.text).includes('503'), 'the confirmation names 503').toBe(true);
});

// A sync.js that keeps R1: a change applies only when its baseVersion equals the task version.
const KEEPS_R1 = `
const seen = new Set();
const EDITABLE = ['title', 'dueDate', 'done'];
export function applyChanges(store, changes) {
  const results = [];
  for (const change of changes) {
    if (seen.has(change.changeId)) { results.push({ changeId: change.changeId, status: 'duplicate' }); continue; }
    const task = store.get(change.taskId);
    if (!task) { results.push({ changeId: change.changeId, status: 'not-found' }); continue; }
    if (change.baseVersion !== task.version) { results.push({ changeId: change.changeId, status: 'conflict', current: task }); continue; }
    for (const field of EDITABLE) if (Object.hasOwn(change.fields ?? {}, field)) task[field] = change.fields[field];
    task.editedAt = change.editedAt;
    task.version += 1;
    store.put(task);
    seen.add(change.changeId);
    results.push({ changeId: change.changeId, status: 'applied', version: task.version });
  }
  return results;
}
export function createSyncRoute(store) {
  return async (request, response) => {
    const { readJson, sendJson } = await import('./http-helpers.js');
    const body = await readJson(request, 64 * 1024);
    sendJson(response, 200, { results: applyChanges(store, body.changes) });
  };
}
`;

async function runConflictTest(folder, writeSync) {
  const dir = tmp(folder);
  await mkdir(dir, { recursive: true });
  for (const name of ['conflict.test.js', 'testing.js', 'tasks-store.js', 'http-helpers.js', 'server.js']) await copyFile(name, join(dir, name));
  await writeSync(join(dir, 'sync.js'));
  const runner = await import(pathToFileURL(join(dir, 'testing.js')).href);
  await import(pathToFileURL(join(dir, 'conflict.test.js')).href);
  return runner.run({ print: false });
}

test('your conflict test fails on the sync.js of the PR', async () => {
  const results = await runConflictTest('on-the-pr', (to) => copyFile('sync.js', to));
  expect(results.length > 0, 'conflict.test.js registers at least one test').toBe(true);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails on the PR').toBe(true);
});

test('your conflict test passes on a sync.js that keeps R1', async () => {
  const results = await runConflictTest('keeps-r1', (to) => writeFile(to, KEEPS_R1));
  expect(results.length > 0, 'conflict.test.js registers at least one test').toBe(true);
  const failed = results.filter((result) => !result.passed).map((result) => `${result.name}: ${result.message}`);
  expect(failed, 'your tests that fail on a sync.js that keeps R1').toEqual([]);
});
