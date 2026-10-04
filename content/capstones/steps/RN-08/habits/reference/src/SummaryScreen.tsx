// The CP-RN enhancement screen: it reads the saved habits and asks the clock for today on every focus,
// so a mark made elsewhere, offline or before a restart is always what it shows. The cleanup ignores a
// late answer.
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { Habit } from '../domain/habits.ts';
import { useServices } from './services.tsx';
import { SummaryView } from './SummaryView.tsx';

export function SummaryScreen() {
  const { repository, clock } = useServices();
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [today, setToday] = useState(() => clock.today());

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setToday(clock.today());
      void repository.readAll().then(({ records }) => {
        if (active) {
          setHabits(records);
        }
      });
      return () => {
        active = false;
      };
    }, [repository, clock]),
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {habits === null ? <Text style={styles.note}>%%loadingListMessage%%</Text> : <SummaryView habits={habits} today={today} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  note: { fontSize: 15, color: '#1a1a1a' },
});
