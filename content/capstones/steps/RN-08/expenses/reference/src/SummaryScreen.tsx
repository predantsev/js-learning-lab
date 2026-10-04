// The CP-RN enhancement screen: it reads the saved expenses on every focus, like the list, so an edit
// made elsewhere, offline or before a restart is always what it shows. The cleanup ignores a late answer.
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { Expense } from '../domain/expenses.ts';
import { useServices } from './services.tsx';
import { SummaryView } from './SummaryView.tsx';

export function SummaryScreen() {
  const { repository, format } = useServices();
  const [expenses, setExpenses] = useState<Expense[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void repository.readAll().then(({ records }) => {
        if (active) {
          setExpenses(records);
        }
      });
      return () => {
        active = false;
      };
    }, [repository]),
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {expenses === null ? <Text style={styles.note}>%%loadingListMessage%%</Text> : <SummaryView expenses={expenses} format={format} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  note: { fontSize: 15, color: '#1a1a1a' },
});
