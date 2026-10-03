// Planner tasks with delete buttons and a task form, in a SIMULATED screen with the keyboard open.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardFrame } from './SimulatedKeyboard.jsx';
import { DeleteButton, TaskForm } from './TaskScreen.jsx';

const initialTasks = [
  { id: 't-01', title: '%%water%%' },
  { id: 't-02', title: '%%books%%' },
];

function PlannerScreen() {
  const [tasks, setTasks] = useState(initialTasks);
  return (
    <View style={{ flex: 1 }}>
      {tasks.map((task) => (
        <View key={task.id} testID="task" style={styles.row}>
          <Text style={styles.rowText}>{task.title}</Text>
          <DeleteButton label={`%%remove%% ${task.title}`} onPress={() => setTasks(tasks.filter((t) => t.id !== task.id))} />
        </View>
      ))}
      <TaskForm />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingLeft: 16, paddingRight: 4, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  rowText: { fontSize: 16, flexShrink: 1 },
});

createRoot(document.getElementById('root')).render(
  <KeyboardFrame>
    <PlannerScreen />
  </KeyboardFrame>,
);
