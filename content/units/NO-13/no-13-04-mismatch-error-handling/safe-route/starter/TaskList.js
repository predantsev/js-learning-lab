// The shared list component (read-only). It expects dueDate to be a 'YYYY-MM-DD' string or null.
import { createElement as h } from './mini-react.js';

export function TaskList({ tasks }) {
  return h('ul', null,
    tasks.map((task) =>
      h('li', { key: task.id }, task.title, ' — ', task.dueDate === null ? '%%noDate%%' : task.dueDate.slice(5))));
}
