// A planner list that reads its tasks through a storage adapter, on a SIMULATED stack (see navSim.jsx).
import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createMemoryStorage } from './memoryStorage.js';
import { SimStack, createStack, useFocusEffect } from './navSim.jsx';

const storage = createMemoryStorage([
  { id: 't-01', title: '%%plants%%', done: false },
  { id: 't-02', title: '%%books%%', done: false },
]);

function ListScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);

  // When does this effect run? Watch the console.
  useEffect(() => {
    console.log('%%logEffect%%');
    storage.readAll().then(setTasks);
  }, []);

  return tasks.map((task) => (
    <Pressable key={task.id} accessibilityRole="button" style={styles.row} onPress={() => navigation.push('Detail', { id: task.id })}>
      <Text>
        {task.done ? '✓ ' : ''}
        {task.title}
      </Text>
    </Pressable>
  ));
}

function DetailScreen({ route }) {
  const [message, setMessage] = useState('');
  async function markDone() {
    const tasks = await storage.readAll();
    await storage.writeAll(tasks.map((task) => (task.id === route.params.id ? { ...task, done: true } : task)));
    setMessage('%%savedDone%%');
  }
  return (
    <View style={styles.column}>
      <Pressable accessibilityRole="button" style={styles.row} onPress={markDone}>
        <Text>%%markDone%%</Text>
      </Pressable>
      <Text>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 8 },
  row: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
});

const stack = createStack('List');
createRoot(document.getElementById('root')).render(
  <SimStack stack={stack} screens={{ List: ListScreen, Detail: DetailScreen }} />,
);
