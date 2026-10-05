// The totals of the four categories and the overall total, computed by the shared summarizeExpenses
// in whole kopiykas; only the formatting adapter turns them into money text.
import { StyleSheet, Text, View } from 'react-native';
import { categoryText, summarizeExpenses } from '../domain/expenses.ts';
import type { CategoryId, Expense } from '../domain/expenses.ts';
import type { MoneyFormat } from './contracts.ts';

const CATEGORY_IDS: CategoryId[] = ['food', 'transport', 'home', 'fun'];

export function CategoryTotals({ expenses, format }: { expenses: Expense[]; format: MoneyFormat }) {
  const summary = summarizeExpenses(expenses);
  return (
    <View style={styles.box}>
      <Text style={styles.total}>{'%%totalLabel%%: ' + format.money(summary.total)}</Text>
      {CATEGORY_IDS.map((category) => (
        <Text key={category} style={styles.line}>
          {categoryText(category) + ': ' + format.money(summary.byCategory[category])}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 2, paddingVertical: 8 },
  total: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  line: { fontSize: 15, color: '#1a1a1a' },
});
