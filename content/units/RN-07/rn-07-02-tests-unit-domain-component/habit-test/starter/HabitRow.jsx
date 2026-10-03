import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// One habit with a "done today" button. Do not change this file: write the test for it.
export function HabitRow({ habit, today }) {
  const [doneToday, setDoneToday] = useState(habit.completions.includes(today));
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{habit.name}</Text>
      <Text>{doneToday ? '%%doneToday%%' : '%%notYet%%'}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`%%markToday%%: ${habit.name}`}
        onPress={() => setDoneToday(!doneToday)}
        style={styles.button}
      >
        <Text>{doneToday ? '✓' : '○'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  name: { flex: 1, fontSize: 16 },
  button: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#4b5563', borderRadius: 24 },
});
