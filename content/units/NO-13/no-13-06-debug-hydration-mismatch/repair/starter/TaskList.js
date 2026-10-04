// The shared list component (read-only). Labels depend on the `today` prop ('YYYY-MM-DD').
import { createElement as h } from './mini-react.js';

function dueLabel(dueDate, today) {
  if (dueDate === null) return '%%noDate%%';
  if (dueDate < today) return '%%overdue%%';
  if (dueDate === today) return '%%dueToday%%';
  return '%%upcoming%%';
}

export function TaskList({ tasks, today }) {
  return h('ul', null,
    tasks.map((task) =>
      h('li', { key: task.id, className: task.done ? 'done' : 'open' },
        task.title.trim(), ' — ', dueLabel(task.dueDate, today))));
}
