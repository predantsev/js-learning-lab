// One habit in the list: the name, the frequency in words and the active or paused mark. A screen
// reader hears the whole row as one sentence: the shared formatter formatHabitLabel and the mark.
import { StyleSheet, Text, View } from 'react-native';
import { formatHabitLabel, frequencyText } from '../domain/habits.ts';
import type { Habit } from '../domain/habits.ts';

export function HabitRow({ habit }: { habit: Habit }) {
  const state = habit.active ? '%%activeMark%%' : '%%pausedMark%%';
  return (
    <View style={styles.row} accessible={true} accessibilityLabel={habit.active ? formatHabitLabel(habit) + ' · ' + state : formatHabitLabel(habit)}>
      <View style={styles.text}>
        <Text style={styles.name}>{habit.name}</Text>
        <Text style={styles.meta}>{frequencyText(habit.frequency)}</Text>
      </View>
      <Text style={habit.active ? styles.active : styles.paused}>{state}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#d4d4d4',
  },
  text: { flexShrink: 1, flexGrow: 1, gap: 2 },
  name: { fontSize: 16, color: '#1a1a1a' },
  meta: { fontSize: 14, color: '#4a4a4a' },
  active: { fontSize: 14, color: '#2f6b2f' },
  paused: { fontSize: 14, color: '#4a4a4a' },
});
