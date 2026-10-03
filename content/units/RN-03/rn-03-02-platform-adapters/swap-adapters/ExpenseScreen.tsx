// ExpenseScreen.tsx: a native screen. It receives its adapters and never asks which platform it is on.
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FormatAdapter, StorageAdapter } from './contracts.ts';
import { removeExpense, summarizeExpenses, type Expense } from './expenses.ts';

const KEY = 'jsll.expenses.v1';

export function ExpenseScreen({ initial, storage, format }: { initial: Expense[]; storage: StorageAdapter; format: FormatAdapter }) {
  const [expenses, setExpenses] = useState(initial);

  useEffect(() => {
    storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: expenses }));
  }, [expenses, storage]);

  const summary = summarizeExpenses(expenses);
  console.log(`domain: summarizeExpenses → ${summary.count} expenses, ${summary.totalMinor} minor units`);

  return (
    <View style={styles.screen}>
      {expenses.map((expense) => (
        <View key={expense.id} style={styles.row}>
          <Text style={styles.label}>{expense.label}</Text>
          <Text>{format.money(expense.amountMinor)}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`%%remove%%: ${expense.label}`}
            style={styles.remove}
            onPress={() => setExpenses(removeExpense(expenses, expense.id))}
          >
            <Text>✕</Text>
          </Pressable>
        </View>
      ))}
      <Text style={styles.total}>%%total%%: {format.money(summary.totalMinor)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 12, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { flex: 1 },
  remove: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  total: { fontWeight: '600', marginTop: 8 },
});
