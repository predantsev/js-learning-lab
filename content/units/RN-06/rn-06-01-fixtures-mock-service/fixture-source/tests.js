import { bundledTasks } from './bundled.ts';
import { pendingTitles } from './screen.ts';
import { createFixtureSource } from './source.ts';

const original = bundledTasks.map((task) => task.id);

test('list() returns a promise', () => {
  expect(typeof createFixtureSource, 'type of createFixtureSource').toBe('function');
  const result = createFixtureSource(bundledTasks).list();
  expect(typeof result?.then, 'type of list().then').toBe('function');
});

test('list() resolves with all the bundled tasks', async () => {
  expect(typeof createFixtureSource, 'type of createFixtureSource').toBe('function');
  const tasks = await createFixtureSource(bundledTasks).list();
  expect(tasks.map((task) => task.id), 'ids of the resolved tasks').toEqual(original);
});

test('every call resolves a new array, so changing it leaves the bundle as it was', async () => {
  expect(typeof createFixtureSource, 'type of createFixtureSource').toBe('function');
  const source = createFixtureSource(bundledTasks);
  const first = await source.list();
  expect(first === bundledTasks, 'list() resolved the bundle array itself').toBe(false);
  first.reverse();
  const second = await source.list();
  expect(second.map((task) => task.id), 'ids from the second call').toEqual(original);
  expect(bundledTasks.map((task) => task.id), 'ids of the bundle').toEqual(original);
});

test('the screen code gets the pending titles through the source', async () => {
  expect(typeof createFixtureSource, 'type of createFixtureSource').toBe('function');
  const titles = await pendingTitles(createFixtureSource(bundledTasks));
  expect(titles, 'pendingTitles(createFixtureSource(bundledTasks))').toEqual([L.t01, L.t02, L.t05]);
});
