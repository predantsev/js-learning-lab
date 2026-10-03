// One expense with its save state (read-only): the label comes from deriveSaveLabel.
import { StyleSheet, Text, View } from 'react-native';
import { deriveSaveLabel } from './saveLabel.js';

export function ExpenseRow({ expense, context, labels }) {
  const label = deriveSaveLabel(expense, context);
  return (
    <View style={styles.row} testID="expense-row">
      <Text style={styles.name}>{expense.label}</Text>
      <Text testID="save-label" style={styles.badge}>{labels[label] ?? String(label)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 8, gap: 2, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  name: { fontSize: 16 },
  badge: { fontSize: 13, color: '#3d3d3d' },
});
