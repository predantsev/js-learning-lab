// ExpenseList.jsx: formatters cached per locale at module level, shared by every row.
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { createDayFormat, createMoneyFormat } from './format.js';

const cache = new Map(); // locale → { money, day }
function formatsFor(locale) {
  if (!cache.has(locale)) cache.set(locale, { money: createMoneyFormat(locale), day: createDayFormat(locale) });
  return cache.get(locale);
}

function ExpenseRow({ expense, locale }) {
  const { money, day } = formatsFor(locale);
  return (
    <View testID={`row-${expense.id}`} style={styles.row}>
      <Text style={styles.label}>{expense.label}</Text>
      <Text>{money.format(expense.amountMinor / 100)}</Text>
      <Text style={styles.date}>{day.format(new Date(`${expense.date}T00:00:00Z`))}</Text>
    </View>
  );
}

export function ExpenseList({ expenses, locale }) {
  return (
    <FlatList
      data={expenses}
      keyExtractor={(expense) => expense.id}
      renderItem={({ item }) => <ExpenseRow expense={item} locale={locale} />}
      initialNumToRender={12}
    />
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 8, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  label: { fontSize: 16, fontWeight: '600' },
  date: { color: '#4b5563' },
});
