// The project's tests, as plain async functions (the sandbox runs them in-process).
import assert from 'node:assert/strict';
import { byPriority, pendingCount } from './src/tasks.ts';

const tasks = [
  { id: 't-03', title: '%%grandma%%', done: false, priority: 'low' },
  { id: 't-02', title: '%%books%%', done: false, priority: 'high' },
  { id: 't-04', title: '%%internet%%', done: true, priority: 'high' },
];

export const checks = {
  'high priority comes first': () => assert.deepEqual(tasks.toSorted(byPriority).map((t) => t.id), ['t-02', 't-04', 't-03']),
  'pendingCount skips done tasks': () => assert.equal(pendingCount(tasks), 2),
};
