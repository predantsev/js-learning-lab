// The habit form, for a new habit or for one being edited. The shared rules (validateHabit through
// checkDraft) decide: an invalid draft shows its messages, a valid one goes to onSave as the fields
// habitsReducer saves, and the form starts again empty.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Habit, HabitErrors } from '../domain/habits.ts';
import type { HabitFields } from '../ui/habitsReducer.ts';
import { ActionButton } from './ActionButton.tsx';
import { ChoiceField } from './ChoiceField.tsx';
import { FormField } from './FormField.tsx';
import { checkDraft, draftOf, fieldsOf, messageFor } from './draft.ts';
import type { Draft } from './draft.ts';

const FREQUENCIES = [
  { value: 'daily', text: '%%daily%%' },
  { value: 'weekly', text: '%%weekly%%' },
];

type HabitFormProps = {
  habit: Habit | null; // the habit being edited, or null for a new one
  onSave: (fields: HabitFields) => void;
  onCancel?: () => void; // shown as a button when given
  onDraftChange?: (draft: Draft) => void; // told about every change of the fields
};

export function HabitForm({ habit, onSave, onCancel, onDraftChange }: HabitFormProps) {
  const [draft, setDraft] = useState<Draft>(draftOf(habit));
  const [errors, setErrors] = useState<HabitErrors>({});

  function change(next: Draft) {
    setDraft(next);
    onDraftChange?.(next);
  }

  function handleSave() {
    const check = checkDraft(draft);
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    onSave(fieldsOf(check.value, habit?.active ?? true));
    setDraft(draftOf(null));
    setErrors({});
  }

  return (
    <View style={styles.form}>
      <Text role="heading" style={styles.heading}>{habit === null ? '%%formTitle%%' : '%%editTitle%%'}</Text>
      <FormField label="%%nameLabel%%" value={draft.name} onChangeText={(name) => change({ ...draft, name: name })} error={messageFor(errors.name)} returnKeyType="done" onSubmitEditing={handleSave} />
      <ChoiceField label="%%valueLabel%%" options={FREQUENCIES} value={draft.frequency} onChange={(frequency) => change({ ...draft, frequency: frequency })} error={messageFor(errors.frequency)} />
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
