// Wrong: shows the message key instead of the localized message.
import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { validateAmount } from './expenses.js';
import { messages } from './messages.js';

export function AmountField({ onSave }) {
  const [text, setText] = useState('');
  const [error, setError] = useState(null);

  function save() {
    const result = validateAmount(text);
    if (!result.ok) {
      setError(result.errors.amountMinor);
      return;
    }
    setError(null);
    onSave(result.value);
    Keyboard.dismiss();
  }

  return (
    <View style={styles.box}>
      <Text style={styles.label}>%%amountLabel%%</Text>
      <TextInput
        accessibilityLabel="%%amountLabel%%"
        style={styles.input}
        value={text}
        onChangeText={setText}
        keyboardType="decimal-pad"
        returnKeyType="done"
        onSubmitEditing={save}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable accessibilityRole="button" style={styles.save} onPress={save}>
        <Text style={styles.saveText}>%%save%%</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: 16, gap: 6 },
  label: { fontSize: 14 },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#4b5563', borderRadius: 6, paddingHorizontal: 10, fontSize: 16 },
  error: { color: '#b91c1c' },
  save: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1d4ed8', borderRadius: 6 },
  saveText: { color: '#ffffff', fontWeight: '600' },
});
