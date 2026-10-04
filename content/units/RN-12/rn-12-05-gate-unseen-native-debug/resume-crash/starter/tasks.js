// tasks.js (read-only): the planner's tasks (synthetic data) and the due rule.
export const tasks = [
  { id: 't-01', title: `%%t1%%`, dueDate: '2026-03-02', done: false },
  { id: 't-02', title: `%%t2%%`, dueDate: '2026-03-01', done: false },
  { id: 't-03', title: `%%t3%%`, dueDate: null, done: false },
  { id: 't-05', title: `%%t5%%`, dueDate: '2026-03-10', done: false },
];

// Pending tasks due on or before the day ('YYYY-MM-DD' compares as text).
export function dueOn(list, day) {
  return list.filter((task) => !task.done && task.dueDate !== null && task.dueDate <= day);
}
