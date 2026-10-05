// The expense form: three labeled text fields, a labeled category choice and a button. The shared
// rules (validateExpense through checkDraft) decide which messages appear; saving the draft comes in
// the next step.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExpenseErrors } from '../domain/expenses.ts';
import { ChoiceField } from './ChoiceField.tsx';
import { FormField } from './FormField.tsx';
import { checkDraft, draftOf, messageFor } from './draft.ts';
import type { Draft } from './draft.ts';

const CATEGORIES = [
  { value: 'food', text: '%%categoryFood%%' },
  { value: 'transport', text: '%%categoryTransport%%' },
  { value: 'home', text: '%%categoryHome%%' },
  { value: 'fun', text: '%%categoryFun%%' },
];

export function ExpenseForm() {
  const [draft, setDraft] = useState<Draft>(draftOf(null));
  const [errors, setErrors] = useState<ExpenseErrors>({});
  const [checked, setChecked] = useState(false);

  function handleSave() {
    const check = checkDraft(draft);
    setErrors(check.ok ? {} : check.errors);
    setChecked(check.ok);
  }

  return (
    <View style={styles.form}>
      <Text role="heading" style={styles.heading}>%%formTitle%%</Text>
      <FormField label="%%nameLabel%%" value={draft.label} onChangeText={(label) => setDraft({ ...draft, label: label })} error={messageFor(errors.label)} />
      <FormField label="%%valueLabel%%" value={draft.amount} onChangeText={(amount) => setDraft({ ...draft, amount: amount })} error={messageFor(errors.amountMinor)} />
      <FormField label="%%dateFieldLabel%%" value={draft.date} onChangeText={(date) => setDraft({ ...draft, date: date })} error={messageFor(errors.date)} />
      <ChoiceField label="%%categoryFieldLabel%%" options={CATEGORIES} value={draft.category} onChange={(category) => setDraft({ ...draft, category: category })} error={messageFor(errors.category)} />
      <Pressable role="button" onPress={handleSave} style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}>
        <Text style={styles.buttonText}>%%saveLabel%%</Text>
      </Pressable>
      {checked ? <Text style={styles.note}>%%draftCheckedNote%%</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12, paddingTop: 8 },
  heading: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  button: { minHeight: 48, borderRadius: 6, backgroundColor: '#1f4e8c', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  pressed: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  note: { fontSize: 15, color: '#1a1a1a' },
});
