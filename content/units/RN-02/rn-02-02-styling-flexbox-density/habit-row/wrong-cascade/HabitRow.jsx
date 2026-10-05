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

// Misconception: flexDirection on the outer row "cascades" down to the inner line, as CSS would.
// It only arranges the row's own children: the line and the details end up side by side.
const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  topLine: {},
  name: { fontSize: 18 },
  count: { fontSize: 18 },
  details: { fontSize: 14, color: '#4b4b4b' },
});
