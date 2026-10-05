// Your test for the requirement the PR misses. It must fail on the PR's sync.js and pass on a
// sync.js that keeps that requirement. Register tests with test(name, fn) from ./testing.js.
import { test, expect } from './testing.js';
import { applyChanges } from './sync.js';
import { createStore } from './tasks-store.js';

// Expects the PR's own answer word for the laptop's change, so it cannot pass on any other design.
test('the laptop change is reported as older', () => {
  const store = createStore([{ id: 't-07', title: 'Plan', dueDate: null, done: false, version: 1, editedAt: '2026-05-04T08:00:00Z' }]);
  applyChanges(store, [{ changeId: 'phone-1', taskId: 't-07', baseVersion: 1, editedAt: '2026-05-04T10:00:00Z', fields: { title: 'phone title' } }]);
  const [laptop] = applyChanges(store, [{ changeId: 'laptop-1', taskId: 't-07', baseVersion: 1, editedAt: '2026-05-04T09:30:00Z', fields: { title: 'laptop title' } }]);
  expect(laptop.status, 'status of the laptop change').toBe('older');
});
