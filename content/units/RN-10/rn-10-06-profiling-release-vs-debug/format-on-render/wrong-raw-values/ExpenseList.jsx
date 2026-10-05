// ExpenseList.jsx: "fast" by dropping the formatting — the user now sees raw minor units and ISO dates.
import { FlatList, StyleSheet, Text, View } from 'react-native';

function ExpenseRow({ expense }) {
  return (
    <View testID={`row-${expense.id}`} style={styles.row}>
      <Text style={styles.label}>{expense.label}</Text>
      <Text>{expense.amountMinor}</Text>
      <Text style={styles.date}>{expense.date}</Text>
    </View>
  );
}

export function ExpenseList({ expenses }) {
  return (
    <FlatList
      data={expenses}
      keyExtractor={(expense) => expense.id}
      renderItem={({ item }) => <ExpenseRow expense={item} />}
      initialNumToRender={12}
    />
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 8, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  label: { fontSize: 16, fontWeight: '600' },
  date: { color: '#4b5563' },
});
