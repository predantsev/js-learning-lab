// One labeled text field: a screen reader announces it by its visible label, and when an error
// appears, the screen reader's focus moves to the error text. The keyboard props come from the form:
// which keyboard to open, what its return key says and what it does.
import { useEffect, useRef } from 'react';
import type { Ref } from 'react';
import { AccessibilityInfo, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error: string; // "" when there is no error
  inputRef?: Ref<TextInput>;
  keyboardType?: TextInputProps['keyboardType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
};

export function FormField({ label, value, onChangeText, error, inputRef, keyboardType, returnKeyType, onSubmitEditing }: FormFieldProps) {
  const errorRef = useRef<Text>(null);
  useEffect(() => {
    if (error !== '' && errorRef.current !== null) {
      AccessibilityInfo.sendAccessibilityEvent(errorRef.current, 'focus');
    }
  }, [error]);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={inputRef}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        submitBehavior={returnKeyType === 'next' ? 'submit' : 'blurAndSubmit'}
        onSubmitEditing={onSubmitEditing}
        style={styles.input}
      />
      {error !== '' ? (
        <Text ref={errorRef} accessible={true} style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 4 },
  label: { fontSize: 16, color: '#1a1a1a' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#767676', borderRadius: 6, paddingHorizontal: 10, fontSize: 16, color: '#1a1a1a' },
  error: { color: '#b91c1c', fontSize: 15 },
});
