// ExpenseList.jsx: a long list of expenses with formatted amounts and dates.
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { createDayFormat, createMoneyFormat } from './format.js';

function ExpenseRow({ expense, formats }) {
  return (
    <View testID={`row-${expense.id}`} style={styles.row}>
      <Text style={styles.label}>{expense.label}</Text>
      <Text>{formats.money.format(expense.amountMinor / 100)}</Text>
      <Text style={styles.date}>{formats.day.format(new Date(`${expense.date}T00:00:00Z`))}</Text>
    </View>
  );
}

export function ExpenseList({ expenses, locale }) {
  // Two formatters for the whole list, built again only if the locale changes.
  const formats = useMemo(() => ({ money: createMoneyFormat(locale), day: createDayFormat(locale) }), [locale]);
  return (
    <FlatList
      data={expenses}
      keyExtractor={(expense) => expense.id}
      renderItem={({ item }) => <ExpenseRow expense={item} formats={formats} />}
      initialNumToRender={12}
    />
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 8, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  label: { fontSize: 16, fontWeight: '600' },
  date: { color: '#4b5563' },
});
