// The expense tracker screen: create, edit and delete expenses, with the category totals above the
// list. The list is a FlatList keyed by id, so a row keeps its state when the rows around it change.
// Every change is an action of expensesReducer (copied unchanged from the React project), and every
// new list is saved through the storage adapter. The adapters come from App.tsx: this screen does not
// know which platform made them.
import { useEffect, useReducer, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Expense } from '../domain/expenses.ts';
import { expensesReducer } from '../ui/expensesReducer.ts';
import type { MoneyFormat, StorageAdapter } from './contracts.ts';
import { CategoryTotals } from './CategoryTotals.tsx';
import { ExpenseForm } from './ExpenseForm.tsx';
import { ExpenseRow } from './ExpenseRow.tsx';
import { saveSnapshot } from './snapshot.ts';

type ExpensesScreenProps = {
  initialExpenses: Expense[];
  loadFailed: boolean;
  storage: StorageAdapter;
  format: MoneyFormat;
};

export function ExpensesScreen({ initialExpenses, loadFailed, storage, format }: ExpensesScreenProps) {
  const insets = useSafeAreaInsets();
  const [expenses, dispatch] = useReducer(expensesReducer, initialExpenses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Every new list is saved; the reducer returns the same list for a refused action, so nothing
  // changes and nothing is saved then.
  useEffect(() => {
    void saveSnapshot(storage, expenses);
  }, [storage, expenses]);

  const sides = { paddingLeft: insets.left + 16, paddingRight: insets.right + 16 };
  return (
    <View style={styles.screen}>
      <View style={[styles.header, sides, { paddingTop: insets.top + 12 }]}>
        <Text role="heading" style={styles.title}>%%projectTitle%%</Text>
      </View>
      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          data={expenses}
          keyExtractor={(expense) => expense.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, sides, { paddingBottom: insets.bottom + 24 }]}
          ListHeaderComponent={
            <View style={styles.top}>
              {loadFailed ? <Text style={styles.error}>%%loadDataError%%</Text> : null}
              <ExpenseForm expense={null} onSave={(fields) => dispatch({ type: 'added', fields: fields })} />
              <CategoryTotals expenses={expenses} format={format} />
              <Text role="heading" style={styles.heading}>%%listTitle%%</Text>
            </View>
          }
          ListEmptyComponent={<Text style={styles.empty}>%%emptyMessage%%</Text>}
          renderItem={({ item }) =>
            item.id === editingId ? (
              <ExpenseForm
                expense={item}
                onSave={(fields) => {
                  dispatch({ type: 'updated', id: item.id, fields: fields });
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <ExpenseRow
                expense={item}
                format={format}
                confirming={item.id === confirmingId}
                onEdit={() => {
                  setConfirmingId(null);
                  setEditingId(item.id);
                }}
                onDelete={() => setConfirmingId(item.id)}
                onConfirmDelete={() => {
                  dispatch({ type: 'removed', id: item.id });
                  setConfirmingId(null);
                }}
                onCancelDelete={() => setConfirmingId(null)}
              />
            )
          }
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: { paddingBottom: 12, backgroundColor: '#e8eef7' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  body: { flex: 1 },
  content: { paddingTop: 8 },
  top: { gap: 8 },
  heading: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', paddingTop: 8 },
  error: { fontSize: 15, color: '#b91c1c' },
  empty: { fontSize: 15, color: '#1a1a1a', paddingVertical: 12 },
});
