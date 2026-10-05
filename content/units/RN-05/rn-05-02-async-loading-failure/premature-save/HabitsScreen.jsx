import { StyleSheet, Text, View } from 'react-native';
import { useHabits } from './useHabits.js';

export function HabitsScreen({ storage, labels }) {
  const habits = useHabits(storage);
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>{labels.title}</Text>
      {habits.length === 0 ? <Text>{labels.empty}</Text> : null}
      {habits.map((habit) => (
        <Text key={habit.id} style={styles.row}>{habit.name}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: '600' },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
});
