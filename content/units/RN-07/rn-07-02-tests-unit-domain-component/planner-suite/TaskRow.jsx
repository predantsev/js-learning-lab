import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// One planner task with a done toggle. The toggle is found by its accessible label.
export function TaskRow({ task, onChange }) {
  const [done, setDone] = useState(task.done);
  function toggle() {
    setDone(!done);
    onChange?.(task.id, !done);
  }
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{task.title}</Text>
      <Text>{done ? '%%done%%' : '%%pending%%'}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`%%markDone%%: ${task.title}`} onPress={toggle} style={styles.toggle}>
        <Text>{done ? '✓' : '○'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  title: { flex: 1 },
  toggle: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#4b5563', borderRadius: 6 },
});
