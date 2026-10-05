import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TaskRow } from './TaskRow.jsx';

// The planner screen: loads tasks through the adapter and saves every toggle through it.
export function TaskScreen({ adapter }) {
  const [tasks, setTasks] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    adapter.loadTasks().then(setTasks);
  }, [adapter]);

  async function handleChange(id, done) {
    setStatus('');
    await adapter.saveTask(id, { done });
    setStatus('%%saved%%');
  }

  if (tasks === null) return <Text>%%loading%%</Text>;
  return (
    <View style={styles.screen}>
      {tasks.map((task) => <TaskRow key={task.id} task={task} onChange={handleChange} />)}
      <Text accessibilityLiveRegion="polite">{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { padding: 12, gap: 4 } });
