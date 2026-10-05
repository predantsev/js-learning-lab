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

// Mistake: the name and the count share a line, but nothing pushes the count to the right edge.
const styles = StyleSheet.create({
  row: { paddingVertical: 12, paddingHorizontal: 16, gap: 4 },
  topLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { fontSize: 18, flexShrink: 1 },
  count: { fontSize: 18 },
  details: { fontSize: 14, color: '#4b4b4b' },
});
