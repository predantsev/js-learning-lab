// AmountField.jsx: the error is derived during render after the first save attempt; inputMode instead of keyboardType.
import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { validateAmount } from './expenses.js';
import { messages } from './messages.js';

export function AmountField({ onSave }) {
  const [text, setText] = useState('');
  const [tried, setTried] = useState(false);
  const result = validateAmount(text);

  function save() {
    setTried(true);
    if (result.ok) {
      onSave(result.value);
      Keyboard.dismiss();
    }
  }

  return (
    <View style={styles.box}>
      <Text style={styles.label}>%%amountLabel%%</Text>
      <TextInput
        accessibilityLabel="%%amountLabel%%"
        style={styles.input}
        value={text}
        onChangeText={(value) => setText(value)}
        inputMode="decimal"
      />
      {tried && !result.ok ? <Text style={styles.error}>{messages[result.errors.amountMinor]}</Text> : null}
      <Pressable role="button" style={styles.save} onPress={save}>
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
