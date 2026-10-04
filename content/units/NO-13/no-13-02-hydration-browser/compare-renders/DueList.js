// Due labels are computed from the task's dueDate and the `today` prop ('YYYY-MM-DD' strings compare
// in calendar order).
import { createElement as h } from './mini-react.js';

function dueLabel(dueDate, today) {
  if (dueDate === null) return '%%noDate%%';
  if (dueDate < today) return '%%overdue%%';
  if (dueDate === today) return '%%dueToday%%';
  return '%%upcoming%%';
}

export function DueList({ tasks, today }) {
  return h('ul', null,
    tasks.map((task) => h('li', { key: task.id }, task.title, ': ', dueLabel(task.dueDate, today))));
}
