// The CP-RN enhancement screen: it reads the saved tasks and asks the clock for today on every focus, so
// an edit made elsewhere, offline or before a restart is always what it shows. The cleanup ignores a
// late answer.
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { Task } from '../domain/tasks.ts';
import { useServices } from './services.tsx';
import { SummaryView } from './SummaryView.tsx';

export function SummaryScreen() {
  const { repository, format, clock } = useServices();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [day, setDay] = useState(() => clock.today());

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setDay(clock.today());
      void repository.readAll().then(({ records }) => {
        if (active) {
          setTasks(records);
        }
      });
      return () => {
        active = false;
      };
    }, [repository, clock]),
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {tasks === null ? <Text style={styles.note}>%%loadingListMessage%%</Text> : <SummaryView tasks={tasks} day={day} format={format} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  note: { fontSize: 15, color: '#1a1a1a' },
});
