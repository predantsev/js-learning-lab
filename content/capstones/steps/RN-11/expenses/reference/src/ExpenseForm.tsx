// The expense form, for a new expense or for one being edited. The shared rules (validateExpense
// through checkDraft) decide: an invalid draft shows its messages, a valid one goes to onSave as the
// fields expensesReducer saves, and the form starts again empty. The return key moves from field to
// field; the amount opens a keyboard with digits and a decimal separator.
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TextInput } from 'react-native';
import type { Expense, ExpenseErrors } from '../domain/expenses.ts';
import type { ExpenseFields } from '../ui/expensesReducer.ts';
import { ActionButton } from './ActionButton.tsx';
import { ChoiceField } from './ChoiceField.tsx';
import { FormField } from './FormField.tsx';
import { checkDraft, draftOf, fieldsOf, messageFor } from './draft.ts';
import type { Draft } from './draft.ts';

const CATEGORIES = [
  { value: 'food', text: '%%categoryFood%%' },
  { value: 'transport', text: '%%categoryTransport%%' },
  { value: 'home', text: '%%categoryHome%%' },
  { value: 'fun', text: '%%categoryFun%%' },
];

type ExpenseFormProps = {
  expense: Expense | null; // the expense being edited, or null for a new one
  onSave: (fields: ExpenseFields) => void;
  onCancel?: () => void; // shown as a button when given
  onDraftChange?: (draft: Draft) => void; // told about every change of the fields
};

export function ExpenseForm({ expense, onSave, onCancel, onDraftChange }: ExpenseFormProps) {
  const [draft, setDraft] = useState<Draft>(draftOf(expense));
  const [errors, setErrors] = useState<ExpenseErrors>({});

  function change(next: Draft) {
    setDraft(next);
    onDraftChange?.(next);
  }
  const amountRef = useRef<TextInput>(null);
  const dateRef = useRef<TextInput>(null);

  function handleSave() {
    const check = checkDraft(draft);
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    onSave(fieldsOf(check.value));
    setDraft(draftOf(null));
    setErrors({});
  }

  return (
    <View style={styles.form}>
      <Text role="heading" style={styles.heading}>{expense === null ? '%%formTitle%%' : '%%editTitle%%'}</Text>
      <FormField label="%%nameLabel%%" value={draft.label} onChangeText={(label) => change({ ...draft, label: label })} error={messageFor(errors.label)} returnKeyType="next" onSubmitEditing={() => amountRef.current?.focus()} />
      <FormField label="%%valueLabel%%" value={draft.amount} onChangeText={(amount) => change({ ...draft, amount: amount })} error={messageFor(errors.amountMinor)} inputRef={amountRef} keyboardType="decimal-pad" returnKeyType="next" onSubmitEditing={() => dateRef.current?.focus()} />
      <FormField label="%%dateFieldLabel%%" value={draft.date} onChangeText={(date) => change({ ...draft, date: date })} error={messageFor(errors.date)} inputRef={dateRef} returnKeyType="done" />
      <ChoiceField label="%%categoryFieldLabel%%" options={CATEGORIES} value={draft.category} onChange={(category) => change({ ...draft, category: category })} error={messageFor(errors.category)} />
      <View style={styles.buttons}>
        <ActionButton text="%%saveLabel%%" kind="primary" onPress={handleSave} />
        {onCancel ? <ActionButton text="%%cancelEditLabel%%" onPress={onCancel} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12, paddingVertical: 8 },
  heading: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
