// reconcile(cache, serverList) on fresh data made inside every check.
import { reconcile } from './reconcile.js';

const task = (id, changes = {}) => ({ id, title: `task ${id}`, dueDate: '2026-03-01', done: false, priority: 'normal', ...changes });
const run = (cache, serverList) => {
  expect(typeof reconcile, 'type of reconcile').toBe('function');
  return reconcile(cache, serverList);
};

test('records are the server list, not the cached copy', () => {
  const cache = [task('t-1'), task('t-2')];
  const serverList = [task('t-1', { done: true }), task('t-2', { title: 'renamed' })];
  expect(run(cache, serverList).records, 'records').toEqual([task('t-1', { done: true }), task('t-2', { title: 'renamed' })]);
});

test('stale lists the cached ids whose server version changed', () => {
  const cache = [task('t-1'), task('t-2'), task('t-3')];
  const serverList = [task('t-1', { done: true }), task('t-2'), task('t-3', { title: 'renamed' })];
  expect(run(cache, serverList).stale, 'stale').toEqual(['t-1', 't-3']);
});

test('a change in any field counts, also null instead of a date', () => {
  const cache = [task('t-1'), task('t-2', { priority: 'low' })];
  const serverList = [task('t-1', { dueDate: null }), task('t-2', { priority: 'high' })];
  expect(run(cache, serverList).stale, 'stale when only dueDate and priority changed').toEqual(['t-1', 't-2']);
});

test('deleted lists the cached ids the server no longer has', () => {
  const cache = [task('t-1'), task('t-2'), task('t-3')];
  const serverList = [task('t-2')];
  const result = run(cache, serverList);
  expect(result.deleted, 'deleted').toEqual(['t-1', 't-3']);
  expect(result.stale, 'stale').toEqual([]);
});

test('a record that is new on the server is neither stale nor deleted', () => {
  const cache = [task('t-1')];
  const serverList = [task('t-1'), task('t-9')];
  const result = run(cache, serverList);
  expect(result.stale, 'stale').toEqual([]);
  expect(result.deleted, 'deleted').toEqual([]);
  expect(result.records.map((record) => record.id), 'ids in records').toEqual(['t-1', 't-9']);
});

test('the cached copy stays unchanged', () => {
  const cache = [task('t-1'), task('t-2')];
  const before = structuredClone(cache);
  run(cache, [task('t-1', { done: true })]);
  expect(cache, 'the cache after reconcile').toEqual(before);
});

test('stale follows the order of the copy', () => {
  const cache = [task('t-1'), task('t-2'), task('t-3'), task('t-4')];
  const serverList = [task('t-4', { title: 'renamed' }), task('t-2', { done: true })];
  expect(run(cache, serverList).stale, 'stale when the server lists t-4 before t-2').toEqual(['t-2', 't-4']);
});
