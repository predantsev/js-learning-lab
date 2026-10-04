// Checks of the repaired lab: real concurrent HTTP requests, a "restart" (a new repository object
// over the same file), the unchanged API contract, and your regression test run against the
// version as reported (seeded/) and against your files.
import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createApp } from './app.js';
import { freshStore } from './lab.js';
import { openRepository } from './repo.js';

const send = (base, method, path, body) =>
  request(`${base}${path}`, { method, body, headers: body === undefined ? {} : { 'content-type': 'application/json' } });

async function startOn(name) {
  const file = await freshStore(name);
  return { file, base: await listen(createApp(await openRepository(file))) };
}
const reopen = async (file) => (await openRepository(file)).list();
const byId = (habits, id) => habits.find((habit) => habit.id === id);

test('two quick PATCHes to two habits both survive a restart', async () => {
  const { file, base } = await startOn('check-two');
  const answers = await Promise.all([send(base, 'PATCH', '/habits/h-01', { name: L.newName }), send(base, 'PATCH', '/habits/h-02', { active: false })]);
  expect(answers.map((answer) => answer.status), 'statuses of the two PATCHes').toEqual([200, 200]);
  const after = await reopen(file);
  expect(byId(after, 'h-01').name, 'name of h-01 after the restart').toBe(L.newName);
  expect(byId(after, 'h-02').active, 'active of h-02 after the restart').toBe(false);
});

test('ten quick PATCHes all survive a restart', async () => {
  const { file, base } = await startOn('check-ten');
  const ids = ['h-01', 'h-02', 'h-03', 'h-04', 'h-05', 'h-06'];
  await Promise.all([
    ...ids.map((id, i) => send(base, 'PATCH', `/habits/${id}`, { name: `${L.newName} ${i + 1}` })),
    ...ids.slice(0, 4).map((id) => send(base, 'PATCH', `/habits/${id}`, { active: false })),
  ]);
  const after = await reopen(file);
  expect(after.map((habit) => habit.name), 'names after the restart').toEqual(ids.map((id, i) => `${L.newName} ${i + 1}`));
  expect(after.map((habit) => habit.active), 'active flags after the restart').toEqual([false, false, false, false, false, true]);
});

test('two quick PATCHes to one habit keep both fields after a restart', async () => {
  const { file, base } = await startOn('check-one');
  await Promise.all([send(base, 'PATCH', '/habits/h-03', { name: L.newName }), send(base, 'PATCH', '/habits/h-03', { active: false })]);
  const habit = byId(await reopen(file), 'h-03');
  expect({ name: habit.name, active: habit.active }, 'h-03 after the restart').toEqual({ name: L.newName, active: false });
});

test('GET /habits shows both changes before a restart', async () => {
  const { base } = await startOn('check-get');
  await Promise.all([send(base, 'PATCH', '/habits/h-01', { name: L.newName }), send(base, 'PATCH', '/habits/h-02', { active: false })]);
  const answer = await send(base, 'GET', '/habits');
  expect(answer.status, 'status of GET /habits').toBe(200);
  expect([byId(answer.json, 'h-01')?.name, byId(answer.json, 'h-02')?.active], 'h-01 name and h-02 active').toEqual([L.newName, false]);
});

test('the API still answers 404 for an unknown habit and 400 for an invalid body', async () => {
  const { file, base } = await startOn('check-contract');
  expect((await send(base, 'PATCH', '/habits/h-99', { active: false })).status, 'status of PATCH /habits/h-99').toBe(404);
  expect((await send(base, 'PATCH', '/habits/h-01', { active: 'no' })).status, 'status of PATCH with active: "no"').toBe(400);
  expect((await send(base, 'PATCH', '/habits/h-01', { name: 'x', colour: 'red' })).status, 'status of PATCH with an unknown field').toBe(400);
  const after = await reopen(file);
  expect(after.length, 'habits in the file').toBe(6);
  expect(byId(after, 'h-01').active, 'active of h-01').toBe(true);
});

// Copies regression.test.js, testing.js, lab.js and habits.js next to the given app/repo/client
// files, imports the copies and runs the registered tests → [{ name, passed, message? }].
async function runRegression(folder, sources) {
  const dir = tmp(folder);
  await mkdir(dir, { recursive: true });
  for (const name of ['regression.test.js', 'testing.js', 'lab.js', 'habits.js']) await copyFile(name, join(dir, name));
  for (const [name, from] of Object.entries(sources)) await copyFile(from, join(dir, name));
  const runner = await import(pathToFileURL(join(dir, 'testing.js')).href);
  await import(pathToFileURL(join(dir, 'regression.test.js')).href);
  return runner.run({ print: false });
}

test('your regression test fails on the version as reported', async () => {
  const results = await runRegression('as-reported', { 'app.js': 'seeded/app.js', 'repo.js': 'seeded/repo.js', 'client.js': 'seeded/client.js' });
  expect(results.length > 0, 'regression.test.js registers at least one test').toBe(true);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails on seeded/').toBe(true);
});

test('your regression test passes on your version', async () => {
  const results = await runRegression('yours', { 'app.js': 'app.js', 'repo.js': 'repo.js', 'client.js': 'client.js' });
  expect(results.length > 0, 'regression.test.js registers at least one test').toBe(true);
  const failed = results.filter((result) => !result.passed).map((result) => `${result.name}: ${result.message}`);
  expect(failed, 'your tests that fail on your version').toEqual([]);
});
