import { createElement as h } from './mini-react.js';

// Expects every habit to have a completions array.
export function HabitList({ habits }) {
  return h('ul', null,
    habits.map((habit) => h('li', { key: habit.id }, habit.name, ': ', habit.completions.length)));
}
