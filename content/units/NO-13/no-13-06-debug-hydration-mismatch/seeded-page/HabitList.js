import { createElement as h } from './mini-react.js';

// Streak: consecutive days with a completion, ending on `today` (plain 'YYYY-MM-DD' dates).
function streak(completions, today) {
  let count = 0;
  const day = new Date(`${today}T00:00:00Z`);
  while (completions.includes(day.toISOString().slice(0, 10))) {
    count += 1;
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return count;
}

export function HabitList({ habits, today }) {
  return h('ul', null,
    habits.map((habit) => h('li', { key: habit.id }, habit.name, ': ', streak(habit.completions, today))));
}
