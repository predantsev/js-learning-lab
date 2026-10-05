// The task form, for a new task or for one being edited. The shared rules (validateTask through
// checkDraft) decide: an invalid draft shows its messages, a valid one goes to onSave as the fields
// tasksReducer saves, and the form starts again empty. The return key moves from field to field.
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TextInput } from 'react-native';
import type { Task, TaskErrors } from '../domain/tasks.ts';
import type { TaskFields } from '../ui/tasksReducer.ts';
import { ActionButton } from './ActionButton.tsx';
import { ChoiceField } from './ChoiceField.tsx';
import { FormField } from './FormField.tsx';
import { checkDraft, draftOf, fieldsOf, messageFor } from './draft.ts';
import type { Draft } from './draft.ts';

const PRIORITIES = [
  { value: 'low', text: '%%priorityLow%%' },
  { value: 'normal', text: '%%priorityNormal%%' },
  { value: 'high', text: '%%priorityHigh%%' },
];

type TaskFormProps = {
  task: Task | null; // the task being edited, or null for a new one
  onSave: (fields: TaskFields) => void;
  onCancel?: () => void; // shown as a button when given
};

export function TaskForm({ task, onSave, onCancel }: TaskFormProps) {
  const [draft, setDraft] = useState<Draft>(draftOf(task));
  const [errors, setErrors] = useState<TaskErrors>({});
  const dueDateRef = useRef<TextInput>(null);

  function handleSave() {
    const check = checkDraft(draft);
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    onSave(fieldsOf(check.value, task?.done ?? false));
    setDraft(draftOf(null));
    setErrors({});
  }

  return (
    <View style={styles.form}>
      <Text role="heading" style={styles.heading}>{task === null ? '%%formTitle%%' : '%%editTitle%%'}</Text>
      <FormField label="%%nameLabel%%" value={draft.title} onChangeText={(title) => setDraft({ ...draft, title: title })} error={messageFor(errors.title)} returnKeyType="next" onSubmitEditing={() => dueDateRef.current?.focus()} />
      <FormField label="%%valueLabel%%" value={draft.dueDate} onChangeText={(dueDate) => setDraft({ ...draft, dueDate: dueDate })} error={messageFor(errors.dueDate)} inputRef={dueDateRef} returnKeyType="done" onSubmitEditing={handleSave} />
      <ChoiceField label="%%priorityFieldLabel%%" options={PRIORITIES} value={draft.priority} onChange={(priority) => setDraft({ ...draft, priority: priority })} error={messageFor(errors.priority)} />
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
