// HabitList.jsx: copied from the web client. Rewrite the markup with React Native primitives.
import { useHabits } from './useHabits.js';

export function HabitList({ initialHabits, storage }) {
  const [habits, dispatch] = useHabits(initialHabits, storage);

  return (
    <ul>
      {habits.map((habit) => (
        <li key={habit.id}>
          <span>{habit.name}</span>
          <button type="button" onClick={() => dispatch({ type: 'toggle-active', id: habit.id })}>
            {habit.active ? '%%pause%%' : '%%resume%%'}
          </button>
        </li>
      ))}
    </ul>
  );
}
