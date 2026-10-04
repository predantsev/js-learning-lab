// The PR's own tests (read-only).
import { test, expect } from './testing.js';
import { applyChanges } from './sync.js';
import { createStore } from './tasks-store.js';

const task = { id: 't-01', title: 'A', dueDate: null, done: false, version: 1, editedAt: '2026-05-04T09:00:00Z' };

test('an edit is applied', () => {
  const store = createStore([task]);
  const [result] = applyChanges(store, [{ changeId: 'pr-1', taskId: 't-01', baseVersion: 1, editedAt: '2026-05-04T10:00:00Z', fields: { done: true } }]);
  expect(result.status).toBe('applied');
  expect(store.get('t-01').done).toBe(true);
});

test('an older edit loses', () => {
  const store = createStore([task]);
  const [result] = applyChanges(store, [{ changeId: 'pr-2', taskId: 't-01', baseVersion: 1, editedAt: '2026-05-04T08:00:00Z', fields: { title: 'B' } }]);
  expect(result.status).toBe('older');
  expect(store.get('t-01').title).toBe('A');
});

test('a resent change is skipped', () => {
  const store = createStore([task]);
  const change = { changeId: 'pr-3', taskId: 't-01', baseVersion: 1, editedAt: '2026-05-04T10:00:00Z', fields: { title: 'C' } };
  applyChanges(store, [change]);
  expect(applyChanges(store, [change])[0].status).toBe('duplicate');
});

test('an unknown task is reported', () => {
  const store = createStore([task]);
  expect(applyChanges(store, [{ changeId: 'pr-4', taskId: 't-99', baseVersion: 1, editedAt: '2026-05-04T10:00:00Z', fields: {} }])[0].status).toBe('not-found');
});
