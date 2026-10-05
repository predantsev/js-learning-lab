// HabitList.jsx: copied from the web client. Rewrite the markup with React Native primitives.
import { Pressable, Text, View } from 'react-native';
import { useHabits } from './useHabits.js';

export function HabitList({ initialHabits, storage }) {
  const [habits, dispatch] = useHabits(initialHabits, storage);

  return (
    <View style={{ gap: 8, padding: 12 }}>
      {habits.map((habit) => (
        <View key={habit.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ flexShrink: 1 }}>{habit.name}</Text>
          <Pressable
            accessibilityRole="button"
            style={{ minHeight: 48, paddingHorizontal: 12, justifyContent: 'center' }}
            onPress={() => dispatch({ type: 'toggle-active', id: habit.id })}
          >
            <Text>{habit.active ? '%%pause%%' : '%%resume%%'}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
