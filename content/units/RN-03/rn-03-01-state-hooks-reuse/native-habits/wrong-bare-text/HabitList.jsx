// Wrong: the habit name sits directly inside a View, without Text.
import { Pressable, Text, View } from 'react-native';
import { useHabits } from './useHabits.js';

export function HabitList({ initialHabits, storage }) {
  const [habits, dispatch] = useHabits(initialHabits, storage);

  return (
    <View>
      {habits.map((habit) => (
        <View key={habit.id}>
          {habit.name}
          <Pressable accessibilityRole="button" onPress={() => dispatch({ type: 'toggle-active', id: habit.id })}>
            <Text>{habit.active ? '%%pause%%' : '%%resume%%'}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
