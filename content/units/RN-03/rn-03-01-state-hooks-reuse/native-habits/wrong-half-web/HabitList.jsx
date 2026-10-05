// Wrong: the rows became View, but the names stay in <span> and the buttons stay web <button>s.
import { View } from 'react-native';
import { useHabits } from './useHabits.js';

export function HabitList({ initialHabits, storage }) {
  const [habits, dispatch] = useHabits(initialHabits, storage);

  return (
    <View>
      {habits.map((habit) => (
        <View key={habit.id}>
          <span>{habit.name}</span>
          <button type="button" onClick={() => dispatch({ type: 'toggle-active', id: habit.id })}>
            {habit.active ? '%%pause%%' : '%%resume%%'}
          </button>
        </View>
      ))}
    </View>
  );
}
