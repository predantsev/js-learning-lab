// TaskList.jsx: the only platform-specific file. Same hook, same reducer, native primitives.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTasks } from './useTasks.js';

let renderCount = 0;

export function TaskList({ initialTasks, storage }) {
  const [tasks, dispatch] = useTasks(initialTasks, storage);
  renderCount += 1;
  console.log(`render ${renderCount}: ${tasks.filter((task) => task.done).length} done`);

  return (
    <View style={styles.list}>
      {tasks.map((task) => (
        <View key={task.id} style={styles.row}>
          <Text style={[styles.title, task.done && styles.doneTitle]}>{task.title}</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.button}
            onPress={() => dispatch({ type: 'toggle', id: task.id })}
          >
            <Text>{task.done ? '%%undo%%' : '%%markDone%%'}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 16, flexShrink: 1 },
  doneTitle: { textDecorationLine: 'line-through', color: '#4b5563' },
  button: { minHeight: 48, minWidth: 48, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1, borderColor: '#4b5563', borderRadius: 6 },
});
