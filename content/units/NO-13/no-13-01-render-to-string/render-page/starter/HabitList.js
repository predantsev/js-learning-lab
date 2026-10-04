// The shared list component (read-only): the server renders it, the browser will hydrate it.
import { createElement as h } from './mini-react.js';

export function HabitList({ habits }) {
  return h('ul', { className: 'habits' },
    habits.map((habit) =>
      h('li', { key: habit.id },
        habit.name, ': ', habit.completions.length,
        h('button', { type: 'button', onClick: () => {} }, '%%doneToday%%'))));
}
