// The task form: two labeled text fields, a labeled priority choice and a button. The shared rules
// (validateTask through checkDraft) decide which messages appear; saving the draft comes in the next step.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TaskErrors } from '../domain/tasks.ts';
import { ChoiceField } from './ChoiceField.tsx';
import { FormField } from './FormField.tsx';
import { checkDraft, draftOf, messageFor } from './draft.ts';
import type { Draft } from './draft.ts';

const PRIORITIES = [
  { value: 'low', text: '%%priorityLow%%' },
  { value: 'normal', text: '%%priorityNormal%%' },
  { value: 'high', text: '%%priorityHigh%%' },
];

export function TaskForm() {
  const [draft, setDraft] = useState<Draft>(draftOf(null));
  const [errors, setErrors] = useState<TaskErrors>({});
  const [checked, setChecked] = useState(false);

  function handleSave() {
    const check = checkDraft(draft);
    setErrors(check.ok ? {} : check.errors);
    setChecked(check.ok);
  }

  return (
    <View style={styles.form}>
      <Text role="heading" style={styles.heading}>%%formTitle%%</Text>
      <FormField label="%%nameLabel%%" value={draft.title} onChangeText={(title) => setDraft({ ...draft, title: title })} error={messageFor(errors.title)} />
      <FormField label="%%valueLabel%%" value={draft.dueDate} onChangeText={(dueDate) => setDraft({ ...draft, dueDate: dueDate })} error={messageFor(errors.dueDate)} />
      <ChoiceField label="%%priorityFieldLabel%%" options={PRIORITIES} value={draft.priority} onChange={(priority) => setDraft({ ...draft, priority: priority })} error={messageFor(errors.priority)} />
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
