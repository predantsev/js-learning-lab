import { StyleSheet, Text, View } from 'react-native';

export function HabitScreen({ habit, labels }) {
  console.log(`render: ${habit.name}`); // unguarded: runs in every build
  if (__DEV__) {
    console.log(`[dev] ${habit.id} completions: ${habit.completions.join(', ')}`);
    console.warn(`[dev] ${habit.id}: check the streak on your declared target`);
  }
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>{habit.name}</Text>
      <Text>{labels.done}: {habit.completions.length}</Text>
      <Text style={styles.mode}>{__DEV__ ? labels.debug : labels.release}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 6 },
  title: { fontSize: 20, fontWeight: '600' },
  mode: { color: '#3d3d3d', fontStyle: 'italic' },
});
