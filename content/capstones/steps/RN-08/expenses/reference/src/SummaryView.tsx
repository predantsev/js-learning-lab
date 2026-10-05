// What the month screen shows, without loading anything: a labeled month choice, a labeled category
// filter, the month's totals and its expenses. Every total and every expense is one element for a
// screen reader, with the amount in full as the money format writes it.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { categoryText, isCategoryId } from '../domain/expenses.ts';
import type { CategoryId, Expense } from '../domain/expenses.ts';
import { ChoiceField } from './ChoiceField.tsx';
import type { MoneyFormat } from './contracts.ts';
import { monthSummary, monthsOf } from './summary.ts';

const CATEGORY_IDS: CategoryId[] = ['food', 'transport', 'home', 'fun'];
const ALL = 'all';

export function SummaryView({ expenses, format }: { expenses: Expense[]; format: MoneyFormat }) {
  const months = monthsOf(expenses);
  const [month, setMonth] = useState(months[0] ?? '');
  const [category, setCategory] = useState(ALL);
  const { summary, shown } = monthSummary(expenses, month, isCategoryId(category) ? category : null);
  const totals = [{ key: 'total', text: '%%totalLabel%%: ' + format.money(summary.total) }, ...CATEGORY_IDS.map((id) => ({ key: id, text: categoryText(id) + ': ' + format.money(summary.byCategory[id]) }))];
  return (
    <View style={styles.view}>
      <ChoiceField label="%%monthLabel%%" options={months.map((value) => ({ value: value, text: value }))} value={month} onChange={setMonth} error="" />
      <ChoiceField label="%%categoryFieldLabel%%" options={[{ value: ALL, text: '%%filterAll%%' }, ...CATEGORY_IDS.map((id) => ({ value: id, text: categoryText(id) }))]} value={category} onChange={setCategory} error="" />
      {totals.map((line) => (
        <Text key={line.key} style={line.key === 'total' ? styles.total : styles.line} accessible={true} accessibilityLabel={line.text}>
          {line.text}
        </Text>
      ))}
      {shown.map((expense) => {
        const text = expense.label + ', ' + expense.date + ', ' + format.money(expense.amountMinor);
        return (
          <Text key={expense.id} style={styles.expense} accessible={true} accessibilityLabel={text}>
            {text}
          </Text>
        );
      })}
      <Text style={styles.note}>%%savedOnDeviceNote%%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  view: { gap: 10 },
  total: { fontSize: 17, fontWeight: '600', color: '#1a1a1a' },
  line: { fontSize: 15, color: '#1a1a1a' },
  expense: { fontSize: 15, color: '#1a1a1a', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  note: { fontSize: 14, color: '#4a4a4a' },
});
