// WishForm.jsx: three fields; the return key moves focus down the form, the last one saves.
import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export function WishForm({ onSave }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const priceRef = useRef(null);
  const categoryRef = useRef(null);

  function save() {
    onSave({ name, price, category });
    Keyboard.dismiss(); // close the keyboard after saving
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.fill}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
        <Text style={styles.label}>%%nameLabel%%</Text>
        <TextInput
          accessibilityLabel="%%nameLabel%%"
          style={styles.input}
          value={name}
          onChangeText={setName}
          autoCapitalize="sentences"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => priceRef.current?.focus()}
        />
        <Text style={styles.label}>%%priceLabel%%</Text>
        <TextInput
          ref={priceRef}
          accessibilityLabel="%%priceLabel%%"
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="number-pad"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => categoryRef.current?.focus()}
        />
        <Text style={styles.label}>%%categoryLabel%%</Text>
        <TextInput
          ref={categoryRef}
          accessibilityLabel="%%categoryLabel%%"
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={save}
        />
        <Pressable accessibilityRole="button" style={styles.save} onPress={save}>
          <Text style={styles.saveText}>%%save%%</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  form: { padding: 16, gap: 6 },
  label: { fontSize: 14 },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#4b5563', borderRadius: 6, paddingHorizontal: 10, fontSize: 16 },
  save: { minHeight: 48, marginTop: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1d4ed8', borderRadius: 6 },
  saveText: { color: '#ffffff', fontWeight: '600' },
});
