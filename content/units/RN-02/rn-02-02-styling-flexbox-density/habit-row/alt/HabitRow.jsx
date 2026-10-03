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

// Another valid approach: the name takes all free space with flex: 1, which pushes the count to the right edge.
const styles = StyleSheet.create({
  row: { padding: 12 },
  topLine: { flexDirection: 'row', marginBottom: 4 },
  name: { fontSize: 18, flex: 1, marginRight: 8 },
  count: { fontSize: 18 },
  details: { fontSize: 14, color: '#4b4b4b' },
});
