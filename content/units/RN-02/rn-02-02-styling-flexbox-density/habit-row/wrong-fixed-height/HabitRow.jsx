import { StyleSheet, View } from 'react-native';
import { ScaledText as Text } from './ScaledText.jsx';

export function HabitRow({ habit }) {
  return (
    <View testID="row" style={styles.row}>
      <View testID="top-line" style={styles.topLine}>
        <Text testID="name" style={styles.name}>{habit.name}</Text>
        <Text testID="count" style={styles.count}>{habit.completions.length}</Text>
      </View>
      <Text testID="details" style={styles.details}>{habit.details}</Text>
    </View>
  );
}

// Mistake: a fixed row height that looks right at 100 % and cannot grow at 200 %.
const styles = StyleSheet.create({
  row: { height: 64, paddingVertical: 8, paddingHorizontal: 16, overflow: 'hidden' },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 18, flexShrink: 1 },
  count: { fontSize: 18 },
  details: { fontSize: 14, color: '#4b4b4b' },
});
