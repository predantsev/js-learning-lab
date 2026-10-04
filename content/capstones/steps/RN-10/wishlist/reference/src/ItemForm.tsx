// The wish form, for a new wish or for one being edited. The shared rules (validateItem through
// checkDraft) decide: an invalid draft shows its messages, a valid one goes to onSave as the fields
// itemsReducer saves, and the form starts again empty. The return key moves from field to field. The
// category takes at most 30 characters: the contract parseItemList refuses a longer one when the saved
// list is read back.
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TextInput } from 'react-native';
import type { Wish, WishErrors } from '../domain/wishes.ts';
import type { WishFields } from '../ui/itemsReducer.ts';
import { ActionButton } from './ActionButton.tsx';
import { FormField } from './FormField.tsx';
import { checkDraft, draftOf, fieldsOf, messageFor } from './draft.ts';
import type { Draft } from './draft.ts';

type ItemFormProps = {
  item: Wish | null; // the wish being edited, or null for a new one
  onSave: (fields: WishFields) => void;
  onCancel?: () => void; // shown as a button when given
  onDraftChange?: (draft: Draft) => void; // told about every change of the fields
};

export function ItemForm({ item, onSave, onCancel, onDraftChange }: ItemFormProps) {
  const [draft, setDraft] = useState<Draft>(draftOf(item));
  const [errors, setErrors] = useState<WishErrors>({});

  function change(next: Draft) {
    setDraft(next);
    onDraftChange?.(next);
  }
  const priceRef = useRef<TextInput>(null);
  const categoryRef = useRef<TextInput>(null);

  function handleSave() {
    const check = checkDraft(draft);
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    onSave(fieldsOf(check.value, draft, item?.acquired ?? false));
    setDraft(draftOf(null));
    setErrors({});
  }

  return (
    <View style={styles.form}>
      <Text role="heading" style={styles.heading}>{item === null ? '%%formTitle%%' : '%%editTitle%%'}</Text>
      <FormField label="%%nameLabel%%" value={draft.name} onChangeText={(name) => change({ ...draft, name: name })} error={messageFor(errors.name)} returnKeyType="next" onSubmitEditing={() => priceRef.current?.focus()} />
      <FormField label="%%valueLabel%%" value={draft.price} onChangeText={(price) => change({ ...draft, price: price })} error={messageFor(errors.price)} inputRef={priceRef} keyboardType="number-pad" returnKeyType="next" onSubmitEditing={() => categoryRef.current?.focus()} />
      <FormField label="%%categoryFieldLabel%%" value={draft.category} onChangeText={(category) => change({ ...draft, category: category })} error="" inputRef={categoryRef} maxLength={30} returnKeyType="done" onSubmitEditing={handleSave} />
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
