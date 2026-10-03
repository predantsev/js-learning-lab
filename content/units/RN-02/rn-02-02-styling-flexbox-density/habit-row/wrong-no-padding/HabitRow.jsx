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

// Mistake: the layout is right, but the row has no padding, so the text touches the row's edges.
const styles = StyleSheet.create({
  row: { gap: 4 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name: { fontSize: 18, flexShrink: 1 },
  count: { fontSize: 18 },
  details: { fontSize: 14, color: '#4b4b4b' },
});
