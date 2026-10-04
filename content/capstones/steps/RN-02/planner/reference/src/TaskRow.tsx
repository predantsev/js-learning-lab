// One task in the list: the title, the due date or the no-due-date label, the priority in words and
// the done state. A screen reader hears the whole row as one sentence: the shared formatter
// formatTaskLabel and the done state.
import { StyleSheet, Text, View } from 'react-native';
import { formatTaskLabel, priorityText } from '../domain/tasks.ts';
import type { Task } from '../domain/tasks.ts';

export function TaskRow({ task }: { task: Task }) {
  const state = task.done ? '%%doneMark%%' : '%%pendingMark%%';
  return (
    <View style={styles.row} accessible={true} accessibilityLabel={formatTaskLabel(task) + ', ' + state}>
      <View style={styles.text}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.meta}>{(task.dueDate ?? '%%noDueDate%%') + ' · ' + priorityText(task.priority)}</Text>
      </View>
      <Text style={task.done ? styles.done : styles.pending}>{state}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#d4d4d4',
  },
  text: { flexShrink: 1, flexGrow: 1, gap: 2 },
  title: { fontSize: 16, color: '#1a1a1a' },
  meta: { fontSize: 14, color: '#4a4a4a' },
  done: { fontSize: 14, color: '#2f6b2f' },
  pending: { fontSize: 14, color: '#4a4a4a' },
});
