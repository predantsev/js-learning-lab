// The copy the client saved yesterday (read-only). Since then the server's list has changed.
export function cachedTasks() {
  return [
    { id: 't-01', title: '%%plants%%', dueDate: '2026-03-02', done: false, priority: 'normal' },
    { id: 't-02', title: '%%library%%', dueDate: '2026-03-01', done: false, priority: 'high' },
    { id: 't-03', title: '%%grandma%%', dueDate: null, done: false, priority: 'low' },
    { id: 't-04', title: '%%internet%%', dueDate: '2026-02-27', done: true, priority: 'high' },
  ];
}
