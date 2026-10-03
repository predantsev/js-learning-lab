// ExpenseList.jsx: useMemo inside every row — still two formatters per mounted row.
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { createDayFormat, createMoneyFormat } from './format.js';

function ExpenseRow({ expense, locale }) {
  const money = useMemo(() => createMoneyFormat(locale), [locale]);
  const day = useMemo(() => createDayFormat(locale), [locale]);
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
