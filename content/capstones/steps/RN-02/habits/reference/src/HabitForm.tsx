// The habit form: a labeled name field, a labeled frequency choice and a button. The shared rules
// (validateHabit through checkDraft) decide which messages appear; saving the draft comes in the next step.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { HabitErrors } from '../domain/habits.ts';
import { ChoiceField } from './ChoiceField.tsx';
import { FormField } from './FormField.tsx';
import { checkDraft, draftOf, messageFor } from './draft.ts';
import type { Draft } from './draft.ts';

const FREQUENCIES = [
  { value: 'daily', text: '%%daily%%' },
  { value: 'weekly', text: '%%weekly%%' },
];

export function HabitForm() {
  const [draft, setDraft] = useState<Draft>(draftOf(null));
  const [errors, setErrors] = useState<HabitErrors>({});
  const [checked, setChecked] = useState(false);

  function handleSave() {
    const check = checkDraft(draft);
    setErrors(check.ok ? {} : check.errors);
    setChecked(check.ok);
  }

  return (
    <View style={styles.form}>
      <Text role="heading" style={styles.heading}>%%formTitle%%</Text>
      <FormField label="%%nameLabel%%" value={draft.name} onChangeText={(name) => setDraft({ ...draft, name: name })} error={messageFor(errors.name)} />
      <ChoiceField label="%%valueLabel%%" options={FREQUENCIES} value={draft.frequency} onChange={(frequency) => setDraft({ ...draft, frequency: frequency })} error={messageFor(errors.frequency)} />
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
