import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { loadExpenses } from './loadExpenses.js';

export function ExpenseScreen({ labels }) {
  const [expenses, setExpenses] = useState(null);

  useEffect(() => {
    loadExpenses().then(setExpenses);
  }, []);

  if (expenses === null) return <Text>{labels.loading}</Text>;
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>{labels.title}</Text>
      {expenses.map((expense) => (
        <Text key={expense.id}>{expense.label}: {(expense.amountMinor / 100).toFixed(2)} {labels.currency}</Text>
      ))}
      <Text style={styles.count}>{labels.count}: {expenses.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 6 },
  title: { fontSize: 20, fontWeight: '600' },
  count: { color: '#3d3d3d' },
});
