// ExpenseSwipeList.jsx: no keyExtractor — FlatList's default key takes item.key, then item.id, then the index.
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSimulatedPan } from './swipeSim.js';
import { categoryTotals } from './totals.js';

const OPEN_AT = -80;
const DELETE_AT = -200;

function SwipeRow({ expense, onDelete }) {
  const [open, setOpen] = useState(false);

  useSimulatedPan(expense.id, {
    onUpdate: () => {}, // on a device the row follows the finger on the UI thread; no JS work per update
    onEnd: ({ translationX }) => {
      if (translationX <= DELETE_AT) onDelete(expense.id);
      else setOpen(translationX <= OPEN_AT);
    },
  });

  const amount = (expense.amountMinor / 100).toFixed(2);
  return (
    <View
      testID={`row-${expense.id}`}
      style={styles.row}
      accessible
      accessibilityLabel={`${expense.label}, ${amount}${open ? ', %%opened%%' : ''}`}
    >
      <Text style={styles.label}>{expense.label}</Text>
      <Text>{amount}</Text>
      {open && (
        <Pressable accessibilityRole="button" onPress={() => onDelete(expense.id)} style={styles.delete}>
          <Text style={styles.deleteText}>%%delete%%</Text>
        </Pressable>
      )}
    </View>
  );
}

export function ExpenseSwipeList({ initialExpenses }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [totals, setTotals] = useState(() => categoryTotals(initialExpenses));

  function handleDelete(id) {
    const next = expenses.filter((expense) => expense.id !== id);
    setExpenses(next);
    setTotals(categoryTotals(next));
  }

  return (
    <View>
      <Text testID="totals">
        {Object.entries(totals).map(([category, minor]) => `${category}: ${(minor / 100).toFixed(2)}`).join(' · ')}
      </Text>
      <FlatList
        data={expenses}
        renderItem={({ item }) => (
          <SwipeRow expense={item} onDelete={handleDelete} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  label: { flex: 1, fontSize: 16 },
  delete: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#b91c1c' },
  deleteText: { color: '#ffffff', fontWeight: '600' },
});
