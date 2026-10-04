// The list screen of the stack: the new-expense form, the category totals and the expenses in a
// FlatList keyed by id. The list — and with it the totals — is read again from the repository every time
// the screen gets the focus, the first time and after every return from the detail or the edit screen.
// The focus effect has no listener to remove: its cleanup only marks an answer that arrives after the
// screen lost the focus as too late.
import { useCallback, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Expense } from '../domain/expenses.ts';
import type { ExpensesAction } from '../ui/expensesReducer.ts';
import { CategoryTotals } from './CategoryTotals.tsx';
import { ExpenseForm } from './ExpenseForm.tsx';
import { ExpenseRow } from './ExpenseRow.tsx';
import type { RootStackParamList } from './navigation.ts';
import { useServices } from './services.tsx';

type ExpensesScreenProps = NativeStackScreenProps<RootStackParamList, 'List'>;

export function ExpensesScreen({ navigation }: ExpensesScreenProps) {
  const insets = useSafeAreaInsets();
  const { repository, format, startingFailed } = useServices();
  const [expenses, setExpenses] = useState<Expense[] | null>(null); // null until the first read answers
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void repository.readAll().then((next) => {
        if (active) {
          setExpenses(next);
        }
      });
      return () => {
        active = false;
      };
    }, [repository]),
  );

  function apply(action: ExpensesAction) {
    void repository.apply(action).then(setExpenses);
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <FlatList
        data={expenses ?? []}
        keyExtractor={(expense) => expense.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingLeft: insets.left + 16, paddingRight: insets.right + 16, paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          <View style={styles.top}>
            {startingFailed ? <Text style={styles.error}>%%loadDataError%%</Text> : null}
            <ExpenseForm expense={null} onSave={(fields) => apply({ type: 'added', fields: fields })} />
            {expenses !== null ? <CategoryTotals expenses={expenses} format={format} /> : null}
            <Text role="heading" style={styles.heading}>%%listTitle%%</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{expenses === null ? '%%loadingListMessage%%' : '%%emptyMessage%%'}</Text>}
        renderItem={({ item }) => (
          <ExpenseRow
            expense={item}
            format={format}
            confirming={item.id === confirmingId}
            onOpen={() => navigation.navigate('Detail', { id: item.id })}
            onDelete={() => setConfirmingId(item.id)}
            onConfirmDelete={() => {
              apply({ type: 'removed', id: item.id });
              setConfirmingId(null);
            }}
            onCancelDelete={() => setConfirmingId(null)}
          />
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  top: { gap: 8, paddingTop: 8 },
  heading: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', paddingTop: 8 },
  error: { fontSize: 15, color: '#b91c1c' },
  empty: { fontSize: 15, color: '#1a1a1a', paddingVertical: 12 },
});
