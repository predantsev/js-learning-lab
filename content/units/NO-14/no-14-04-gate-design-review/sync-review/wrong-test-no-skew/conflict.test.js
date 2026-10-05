// Your test for the requirement the PR misses. It must fail on the PR's sync.js and pass on a
// sync.js that keeps that requirement. Register tests with test(name, fn) from ./testing.js.
import { test, expect } from './testing.js';
import { applyChanges } from './sync.js';
import { createStore } from './tasks-store.js';

// R1: the phone edits at 10:00 and syncs first. The laptop edited earlier, offline, based on the
// same version 1 — but its clock runs an hour ahead, so its editedAt says 10:30.
test('an older edit from a device with a fast clock does not overwrite a newer edit', () => {
  const store = createStore([{ id: 't-07', title: 'Plan', dueDate: null, done: false, version: 1, editedAt: '2026-05-04T08:00:00Z' }]);
  applyChanges(store, [{ changeId: 'phone-1', taskId: 't-07', baseVersion: 1, editedAt: '2026-05-04T10:00:00Z', fields: { title: 'phone title' } }]);
  applyChanges(store, [{ changeId: 'laptop-1', taskId: 't-07', baseVersion: 1, editedAt: '2026-05-04T09:30:00Z', fields: { title: 'laptop title' } }]);
  expect(store.get('t-07').title, 'title after both devices synced').toBe('phone title');
});
