// Question 3: a planner home screen that reports due tasks when the app comes back (simulated AppState).
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppState } from './appStateSim.jsx';

// Pending tasks with a due date on or before `today` ('YYYY-MM-DD' strings compare like dates).
function countDueTasks(tasks, today) {
  return tasks.filter((task) => !task.done && task.dueDate !== null && task.dueDate <= today).length;
}

export function PlannerHome({ initialTasks, today, labels }) {
  const [tasks, setTasks] = useState(initialTasks);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') console.log('planner: due on return =', countDueTasks(tasks, today));
    });
    return () => subscription.remove();
  }, []);

  function addDueToday() {
    setTasks([...tasks, { id: `t-${tasks.length + 1}`, title: labels.newTask, dueDate: today, done: false, priority: 'normal' }]);
  }

  return (
    <View style={styles.column}>
      <Text>
        {labels.due} {countDueTasks(tasks, today)}
      </Text>
      <Pressable accessibilityRole="button" style={styles.button} onPress={addDueToday}>
        <Text>{labels.add}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 8 },
  button: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#767676', borderRadius: 8 },
});
