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

// Fill in the styles: the name and the count on one line (the count at the right edge),
// the details below, spacing in density-independent units — and the row must still read at 200 %.
const styles = StyleSheet.create({
  row: { paddingVertical: 12, paddingHorizontal: 16, gap: 4 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name: { fontSize: 18, flexShrink: 1 },
  count: { fontSize: 18 },
  details: { fontSize: 14, color: '#4b4b4b' },
});
