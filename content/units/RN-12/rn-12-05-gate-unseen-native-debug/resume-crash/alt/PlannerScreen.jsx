// PlannerScreen.jsx: the "due today" screen after the day-clock 2.0.0 update.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatDay, today } from './day-clock/index.js';
import { dueOn, tasks } from './tasks.js';
import { useResumeDay } from './useResumeDay.js';

export function PlannerScreen({ appState, clock }) {
  const [day, setDay] = useState(null);
  useEffect(() => {
    today(clock).then(setDay);
  }, [clock]);
  useResumeDay(appState, clock, useCallback((next) => setDay(next), []));
  if (day === null) return null;
  const due = dueOn(tasks, day);

  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.heading}>
        %%dueOn%% {formatDay(day)}: {due.length}
      </Text>
      {due.map((task) => (
        <Text key={task.id}>{task.title}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 8, backgroundColor: '#ffffff' },
  heading: { fontSize: 20, fontWeight: '600' },
});
