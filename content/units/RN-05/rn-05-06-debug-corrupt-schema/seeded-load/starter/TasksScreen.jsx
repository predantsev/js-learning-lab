// The planner screen (read-only): it only shows what useTasks reports.
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTasks } from './useTasks.js';

export function TasksScreen({ storage, labels }) {
  const { status, tasks, notice, toggle } = useTasks(storage);

  if (status === 'loading') {
    return (
      <View style={styles.screen}>
        <ActivityIndicator />
        <Text>{labels.loading}</Text>
      </View>
    );
  }
  if (status === 'failed') return <Text style={styles.screen}>{labels.failed}</Text>;
  return (
    <View style={styles.screen}>
      {notice === 'recovered' ? <Text testID="notice" style={styles.notice}>{labels.recovered}</Text> : null}
      {tasks.length === 0 ? <Text>{labels.empty}</Text> : null}
      {tasks.map((task) => (
        <Pressable key={task.id} testID="task" accessibilityRole="checkbox" accessibilityState={{ checked: task.done }} style={styles.row} onPress={() => toggle(task.id)}>
          <Text>{`${task.done ? '✓' : '○'} ${task.title}`}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 8 },
  notice: { padding: 8, backgroundColor: '#fef3c7', color: '#713f12', borderRadius: 6 },
  row: { minHeight: 44, justifyContent: 'center', borderBottomWidth: 1, borderColor: '#d4d4d4' },
});
