// tasks.js (read-only): the planner's tasks (synthetic data).
// A task: { id: string, title: string, dueDate: 'YYYY-MM-DD' | null, done: boolean }
export const tasks = [
  { id: 't-01', title: `%%t1%%`, dueDate: '2026-03-02', done: false },
  { id: 't-02', title: `%%t2%%`, dueDate: '2026-03-01', done: false },
  { id: 't-03', title: `%%t3%%`, dueDate: null, done: false },
  { id: 't-04', title: `%%t4%%`, dueDate: '2026-02-27', done: true },
  { id: 't-05', title: `%%t5%%`, dueDate: '2026-03-10', done: false },
  { id: 't-06', title: `%%t6%%`, dueDate: '2026-02-26', done: false },
];
