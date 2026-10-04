// The list screen of the stack (it also says when a damaged snapshot was set aside, and offers a new
// read when the storage could not be read): the new-expense form, the category totals and the expenses in a
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
import { ActionButton } from './ActionButton.tsx';
import type { RootStackParamList } from './navigation.ts';
import { useServices } from './services.tsx';

type ExpensesScreenProps = NativeStackScreenProps<RootStackParamList, 'List'>;

export function ExpensesScreen({ navigation }: ExpensesScreenProps) {
  const insets = useSafeAreaInsets();
  const { repository, format, startingFailed } = useServices();
  const [expenses, setExpenses] = useState<Expense[] | null>(null); // null until the first read answers
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false); // the storage could not be read
  const [recovered, setRecovered] = useState(false); // a damaged snapshot was set aside
  const [attempt, setAttempt] = useState(0); // a new value reads again

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void repository.readAll().then(
        (read) => {
          if (active) {
            setExpenses(read.records);
            setFailed(false);
            if (read.recovered) {
              setRecovered(true);
            }
          }
        },
        () => {
          if (active) {
            setFailed(true);
          }
        },
      );
      return () => {
        active = false;
      };
    }, [repository, attempt]),
  );

  function apply(action: ExpensesAction) {
    void repository.apply(action).then(setExpenses, () => setFailed(true));
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
            {recovered ? <Text style={styles.error}>%%loadErrorMessage%%</Text> : null}
            {failed ? (
              <View style={styles.failed}>
                <Text style={styles.error}>%%listLoadFailedMessage%%</Text>
                <ActionButton text="%%retryLoadLabel%%" onPress={() => setAttempt(attempt + 1)} />
              </View>
            ) : null}
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
  failed: { gap: 8 },
  empty: { fontSize: 15, color: '#1a1a1a', paddingVertical: 12 },
});
