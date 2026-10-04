// One expense in the list: the label, the amount through the formatting adapter, the date and the
// category — pressing them opens the expense — then the delete, which asks first, inside the row. A
// screen reader hears the text part as one sentence: the shared formatter formatExpenseLabel, the date
// and the category.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryText, formatExpenseLabel } from '../domain/expenses.ts';
import type { Expense } from '../domain/expenses.ts';
import type { MoneyFormat } from './contracts.ts';
import { ActionButton } from './ActionButton.tsx';

type ExpenseRowProps = {
  expense: Expense;
  format: MoneyFormat;
  confirming: boolean; // the delete question is open
  onOpen: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
};

export function ExpenseRow({ expense, format, confirming, onOpen, onDelete, onConfirmDelete, onCancelDelete }: ExpenseRowProps) {
  const meta = expense.date + ' · ' + categoryText(expense.category);
  return (
    <View style={styles.row}>
      <Pressable role="button" accessibilityLabel={formatExpenseLabel(expense) + ', ' + meta} onPress={onOpen} style={({ pressed }) => [styles.line, pressed ? styles.pressed : null]}>
        <View style={styles.text}>
          <Text style={styles.label}>{expense.label}</Text>
          <Text style={styles.meta}>{meta}</Text>
        </View>
        <Text style={styles.amount}>{format.money(expense.amountMinor)}</Text>
      </Pressable>
      {confirming ? (
        <View style={styles.actions}>
          <Text style={styles.question}>%%confirmQuestion%%</Text>
          <ActionButton text="%%confirmDeleteLabel%%" kind="danger" onPress={onConfirmDelete} />
          <ActionButton text="%%cancelLabel%%" onPress={onCancelDelete} />
        </View>
      ) : (
        <View style={styles.actions}>
          <ActionButton text="%%deleteLabel%%" kind="danger" onPress={onDelete} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  pressed: { opacity: 0.6 },
  text: { flexShrink: 1, flexGrow: 1, gap: 2 },
  label: { fontSize: 16, color: '#1a1a1a' },
  meta: { fontSize: 14, color: '#4a4a4a' },
  amount: { fontSize: 16, color: '#1a1a1a' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  question: { fontSize: 15, color: '#1a1a1a', flexBasis: '100%' },
});
