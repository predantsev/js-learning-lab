// Read-only stand-in for the task storage. Set repository.broken = true to make list() fail,
// the way a real storage fails when a disk or a database is not available.
const tasks = [
  { id: 't-01', title: '%%task1%%', dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: '%%task2%%', dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: '%%task3%%', dueDate: null, done: false, priority: 'low' },
];

export const repository = {
  broken: false,
  list() {
    if (this.broken) throw new Error('storage is not ready');
    return tasks;
  },
};
