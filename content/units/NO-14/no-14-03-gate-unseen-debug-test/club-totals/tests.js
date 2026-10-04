// Checks of the repaired club: real HTTP requests, a restart (a new connection to the same SQLite
// file), the page compared with a reloaded page, the unchanged API contract, and your regression
// test run against the version as reported (seeded/) and against your files.
import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createApp } from './app.js';
import { createClient } from './client.js';
import { freshClub } from './club-data.js';
import { openClub } from './repo.js';

const post = (base, body) => request(`${base}/reads`, { method: 'POST', body, headers: { 'content-type': 'application/json' } });
const start = async (file) => {
  const club = openClub(file);
  return { club, base: await listen(createApp(club)) };
};
// A "restart": a new connection to the same file and a new server, then the summary.
const summaryAfterRestart = async (file) => {
  const { club, base } = await start(file);
  try {
    return (await request(`${base}/summary`)).json;
  } finally {
    club.close();
  }
};
const totals = (summary) => summary.map((m) => `${m.id} ${m.pagesRead}/${m.votes}`);
const AT_START = ['m-01 40/1', 'm-02 55/0', 'm-03 0/2', 'm-04 12/0', 'm-05 0/0'];

test('after logging, every total is counted once, also after a restart', async () => {
  const file = freshClub(tmp('check-totals'));
  const { club, base } = await start(file);
  const statuses = [
    (await post(base, { memberId: 'm-03', bookId: 'b-02', pages: 30 })).status,
    (await post(base, { memberId: 'm-01', bookId: 'b-03', pages: 10 })).status,
  ];
  const before = (await request(`${base}/summary`)).json;
  club.close();
  expect(statuses, 'statuses of the two POST /reads').toEqual([201, 201]);
  const expected = ['m-01 50/1', 'm-02 55/0', 'm-03 30/2', 'm-04 12/0', 'm-05 0/0'];
  expect(totals(before), 'pagesRead/votes before the restart').toEqual(expected);
  expect(totals(await summaryAfterRestart(file)), 'pagesRead/votes after the restart').toEqual(expected);
});

test('two readings with the same number of pages both count', async () => {
  const file = freshClub(tmp('check-equal'));
  const { club, base } = await start(file);
  await post(base, { memberId: 'm-02', bookId: 'b-03', pages: 25 });
  club.close();
  const denys = (await summaryAfterRestart(file)).find((m) => m.id === 'm-02');
  expect(denys?.pagesRead, 'pagesRead of m-02 after 25 + 30 + 25').toBe(80);
});

test('a member who logged nothing and voted for nothing is listed with zeros', async () => {
  const file = freshClub(tmp('check-zeros'));
  const summary = await summaryAfterRestart(file);
  expect(summary.map((m) => m.id), 'ids in the summary').toEqual(['m-01', 'm-02', 'm-03', 'm-04', 'm-05']);
  expect(totals(summary).at(-1), 'm-05').toBe('m-05 0/0');
});

test('the page and a reloaded page show the same totals after logging pages', async () => {
  const file = freshClub(tmp('check-page'));
  const { club, base } = await start(file);
  try {
    const page = createClient(base);
    await page.load();
    await page.logPages('m-03', 'b-02', 30);
    const reloaded = createClient(base);
    await reloaded.load();
    expect(totals(page.members), 'the page after logging').toEqual(totals(reloaded.members));
  } finally {
    club.close();
  }
});

test('invalid readings still get 400 or 404, and nothing is stored', async () => {
  const file = freshClub(tmp('check-contract'));
  const { club, base } = await start(file);
  const statuses = [];
  for (const body of [
    { memberId: 'm-01', bookId: 'b-01', pages: 0 },
    { memberId: 'm-01', bookId: 'b-01', pages: 2001 },
    { memberId: 'm-01', bookId: 'b-01', pages: '30' },
    { memberId: 'm-99', bookId: 'b-01', pages: 30 },
    { memberId: 'm-01', bookId: 'b-99', pages: 30 },
  ]) statuses.push((await post(base, body)).status);
  statuses.push((await request(`${base}/reads`, { method: 'POST', body: '{"memberId":', headers: { 'content-type': 'application/json' } })).status);
  club.close();
  expect(statuses, 'statuses: pages 0, pages 2001, pages "30", m-99, b-99, broken JSON').toEqual([400, 400, 400, 404, 404, 400]);
  expect(totals(await summaryAfterRestart(file)), 'totals after the refused requests').toEqual(AT_START);
});

// Copies regression.test.js and the read-only helpers next to the given app/repo/client files,
// imports the copies and runs the registered tests → [{ name, passed, message? }].
async function runRegression(folder, sources) {
  const dir = tmp(folder);
  await mkdir(dir, { recursive: true });
  for (const name of ['regression.test.js', 'testing.js', 'lab.js', 'club-data.js']) await copyFile(name, join(dir, name));
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
