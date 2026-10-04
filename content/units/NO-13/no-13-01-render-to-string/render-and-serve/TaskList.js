// A list component written with createElement, because Node.js cannot read JSX.
import { createElement as h, useEffect } from './mini-react.js';

export function TaskList({ tasks }) {
  console.log('%%bodyRuns%%');
  useEffect(() => {
    console.log('%%effectRuns%%');
  }, []);
  return h('ul', { className: 'tasks' },
    tasks.map((task) =>
      h('li', { key: task.id },
        task.title, ' — ', task.dueDate ?? '%%noDate%%',
        h('button', { type: 'button', onClick: () => console.log('%%clicked%%') },
          task.done ? '%%undo%%' : '%%markDone%%'))));
}
