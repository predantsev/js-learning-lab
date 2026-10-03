// A variant: the report follows a deferred copy of the tasks, so React commits the row first.
import { useDeferredValue, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { buildReport } from './report.js';

export function TaskList({ initialTasks }) {
  const [tasks, setTasks] = useState(initialTasks);
  const deferredTasks = useDeferredValue(tasks);
  const report = useMemo(() => buildReport(deferredTasks), [deferredTasks]);

  function toggle(id) {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  return (
    <View style={styles.screen}>
      {tasks.map((task) => (
        <View key={task.id} style={styles.row}>
          <Text style={styles.title}>{task.title}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`%%toggle%%: ${task.title}`}
            onPress={() => toggle(task.id)}
            style={({ pressed }) => [styles.check, pressed && styles.pressed]}
          >
            <Text>{task.done ? '✓' : '○'}</Text>
          </Pressable>
        </View>
      ))}
      <Text>%%report%%: {report.done} / {report.total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 12, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 16 },
  check: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#4b5563', borderRadius: 4 },
  pressed: { backgroundColor: '#dbeafe' },
});
