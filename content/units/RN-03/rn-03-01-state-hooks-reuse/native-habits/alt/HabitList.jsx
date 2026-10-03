// HabitList.jsx: a variant with a separate row component, the role prop and a StyleSheet.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useHabits } from './useHabits.js';

function HabitRow({ habit, onToggle }) {
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{habit.name}</Text>
      <Pressable role="button" style={styles.button} onPress={onToggle}>
        <Text>{habit.active ? '%%pause%%' : '%%resume%%'}</Text>
      </Pressable>
    </View>
  );
}

export function HabitList({ initialHabits, storage }) {
  const [habits, dispatch] = useHabits(initialHabits, storage);
  return (
    <View style={styles.list}>
      {habits.map((habit) => (
        <HabitRow key={habit.id} habit={habit} onToggle={() => dispatch({ type: 'toggle-active', id: habit.id })} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1 },
  button: { minHeight: 48, paddingHorizontal: 12, justifyContent: 'center' },
});
