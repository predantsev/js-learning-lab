// One expense in the list: the label, the amount in hryvnias, the date and the category. A screen
// reader hears the whole row as one sentence: the shared formatter formatExpenseLabel, the date and
// the category.
import { StyleSheet, Text, View } from 'react-native';
import { categoryText, formatAmount, formatExpenseLabel } from '../domain/expenses.ts';
import type { Expense } from '../domain/expenses.ts';

export function ExpenseRow({ expense }: { expense: Expense }) {
  const meta = expense.date + ' · ' + categoryText(expense.category);
  return (
    <View style={styles.row} accessible={true} accessibilityLabel={formatExpenseLabel(expense) + ', ' + meta}>
      <View style={styles.text}>
        <Text style={styles.label}>{expense.label}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      <Text style={styles.amount}>{formatAmount(expense.amountMinor) + ' %%currency%%'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#d4d4d4',
  },
  text: { flexShrink: 1, flexGrow: 1, gap: 2 },
  label: { fontSize: 16, color: '#1a1a1a' },
  meta: { fontSize: 14, color: '#4a4a4a' },
  amount: { fontSize: 16, color: '#1a1a1a' },
});
