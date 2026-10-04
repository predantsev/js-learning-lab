import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { writeTasks } from './store.js';
import { verifyRestore } from './verify-restore.js';

const DAY = '2026-03-02';
const tasks = () => [
  { id: 't-01', title: L.plants, dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: L.books, dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: L.grandma, dueDate: null, done: false, priority: 'low' },
  { id: 't-04', title: L.internet, dueDate: '2026-02-27', done: true, priority: 'high' },
];
let cases = 0;
async function dirs(restored) {
  const base = `.tmp/case-${++cases}`;
  await rm(base, { recursive: true, force: true });
  await writeTasks(`${base}/source`, tasks());
  if (restored !== undefined) await writeTasks(`${base}/restored`, restored);
  else await mkdir(`${base}/restored`, { recursive: true });
  return { source: `${base}/source`, restored: `${base}/restored` };
}
async function reportOf({ source, restored }) {
  try {
    return await verifyRestore(source, restored, DAY);
  } catch (error) {
    return { thrown: `${error.name}: ${error.message}` };
  }
}
const guard = () => expect(typeof verifyRestore, 'type of verifyRestore').toBe('function');

test('an exact copy passes', async () => {
  guard();
  expect(await reportOf(await dirs(tasks())), 'the report').toEqual({ ok: true, problems: [] });
});

test('the same records in another order pass', async () => {
  guard();
  expect((await reportOf(await dirs(tasks().reverse()))).ok, 'report.ok for reversed records').toBe(true);
});

test('a missing record is reported with its id', async () => {
  guard();
  const report = await reportOf(await dirs(tasks().filter((t) => t.id !== 't-03')));
  expect(report.ok, 'report.ok without t-03').toBe(false);
  expect(String(report.problems), 'the problems').toContain('t-03');
});

test('an extra record is reported with its id', async () => {
  guard();
  const report = await reportOf(await dirs([...tasks(), { id: 't-77', title: L.plants, dueDate: null, done: false, priority: 'low' }]));
  expect(report.ok, 'report.ok with an extra t-77').toBe(false);
  expect(String(report.problems), 'the problems').toContain('t-77');
});

test('the same ids with a changed summary are reported', async () => {
  guard();
  const changed = tasks().map((t) => (t.id === 't-02' ? { ...t, done: true } : t));
  expect((await reportOf(await dirs(changed))).ok, 'report.ok when t-02 became done').toBe(false);
});

test('a file of the same size with other ids is reported', async () => {
  guard();
  const where = await dirs(tasks());
  const text = await readFile(`${where.source}/tasks.json`, 'utf8');
  await writeFile(`${where.restored}/tasks.json`, text.replace('"t-01"', '"t-09"'));
  expect((await reportOf(where)).ok, 'report.ok for t-09 in place of t-01').toBe(false);
});

test('a torn backup is reported, not thrown', async () => {
  guard();
  const where = await dirs(tasks());
  const text = await readFile(`${where.source}/tasks.json`, 'utf8');
  await writeFile(`${where.restored}/tasks.json`, text.slice(0, 120));
  const report = await reportOf(where);
  expect(report.thrown ?? null, 'what verifyRestore threw').toBe(null);
  expect(report.ok, 'report.ok for a torn file').toBe(false);
});

test('a restore folder without tasks.json is reported, not thrown', async () => {
  guard();
  const report = await reportOf(await dirs(undefined));
  expect(report.thrown ?? null, 'what verifyRestore threw').toBe(null);
  expect(report.ok, 'report.ok without tasks.json').toBe(false);
});
