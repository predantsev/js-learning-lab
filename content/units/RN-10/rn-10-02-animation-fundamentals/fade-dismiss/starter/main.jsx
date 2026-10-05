// Shows the expense list and counts how many times ExpenseRow renders. Do not edit.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StyleSheet, View } from 'react-native';
import { ExpenseRow } from './ExpenseRow.jsx';

export const rowRenders = { count: 0 }; // how many times the ExpenseRow function ran

// Runs your ExpenseRow function and counts each run (its hooks belong to this wrapper).
function CountedRow(props) {
  rowRenders.count += 1;
  return ExpenseRow(props);
}

function ExpenseList() {
  const [expenses, setExpenses] = useState([
    { id: 'e-01', label: '%%groceries%%', amountMinor: 84550 },
    { id: 'e-02', label: '%%pass%%', amountMinor: 52000 },
    { id: 'e-03', label: '%%coffee%%', amountMinor: 18000 },
    { id: 'e-04', label: '%%bulbs%%', amountMinor: 9990 },
  ]);

  function handleDismissed(id) {
    console.log(`onDismissed(${id})`);
    setExpenses((current) => current.filter((expense) => expense.id !== id));
  }

  return (
    <View style={styles.screen}>
      {expenses.map((expense) => (
        <CountedRow key={expense.id} expense={expense} onDismissed={handleDismissed} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ screen: { padding: 12, gap: 8, overflow: 'hidden' } });

createRoot(document.getElementById('root')).render(<ExpenseList />);
