// What the overdue screen shows, without loading anything: the day, the count and the overdue tasks.
// Every task is one element for a screen reader: title, due date, priority.
import { StyleSheet, Text, View } from 'react-native';
import { priorityText } from '../domain/tasks.ts';
import type { Task } from '../domain/tasks.ts';
import type { DateFormat } from './contracts.ts';
import { overdueTasks } from './summary.ts';

export function SummaryView({ tasks, day, format }: { tasks: Task[]; day: string; format: DateFormat }) {
  const overdue = overdueTasks(tasks, day);
  return (
    <View style={styles.view}>
      <Text role="heading" style={styles.heading}>{'%%overdueBeforeLabel%% ' + format.day(day) + ': ' + overdue.length}</Text>
      {overdue.length === 0 ? <Text style={styles.line}>%%noOverdueMessage%%</Text> : null}
      {overdue.map((task) => {
        const line = format.day(task.dueDate) + ' · ' + priorityText(task.priority);
        return (
          <View key={task.id} style={styles.row} accessible={true} accessibilityLabel={task.title + ', ' + line}>
            <Text style={styles.title}>{task.title}</Text>
            <Text style={styles.line}>{line}</Text>
          </View>
        );
      })}
      <Text style={styles.note}>%%savedOnDeviceNote%%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  view: { gap: 12 },
  heading: { fontSize: 17, fontWeight: '600', color: '#1a1a1a' },
  row: { gap: 2, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  title: { fontSize: 16, color: '#1a1a1a' },
  line: { fontSize: 15, color: '#1a1a1a' },
  note: { fontSize: 14, color: '#4a4a4a' },
});
