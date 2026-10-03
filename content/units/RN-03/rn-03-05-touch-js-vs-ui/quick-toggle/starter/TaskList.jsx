// TaskList.jsx: planner rows with a done toggle and a report over the whole history.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { buildReport } from './report.js';

export function TaskList({ initialTasks }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [report, setReport] = useState(() => buildReport(initialTasks));

  function toggle(id) {
    const next = tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task));
    setTasks(next);
    setReport(buildReport(next));
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
  check: { padding: 2, borderWidth: 1, borderColor: '#4b5563', borderRadius: 4 },
  pressed: { backgroundColor: '#dbeafe' },
});
