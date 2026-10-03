import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SimulatedKeyboardAvoidingView } from './SimulatedKeyboard.jsx';

// Mistake: the target grows by blowing up the icon itself, which changes the design.
export function DeleteButton({ label, onPress }) {
  return (
    <Pressable testID="delete" role="button" accessibilityLabel={label} onPress={onPress} style={styles.deleteButton}>
      <Text testID="delete-icon" style={styles.icon}>✕</Text>
    </Pressable>
  );
}

export function TaskForm() {
  return (
    <SimulatedKeyboardAvoidingView behavior="padding" style={styles.form}>
      <ScrollView contentContainerStyle={styles.fields}>
        <Text style={styles.label}>%%taskTitle%%</Text>
        <TextInput style={styles.input} />
        <Text style={styles.label}>%%dueDate%%</Text>
        <TextInput style={styles.input} />
        <Text style={styles.label}>%%priority%%</Text>
        <TextInput style={styles.input} />
        <Pressable role="button" style={styles.save}>
          <Text style={styles.saveText}>%%save%%</Text>
        </Pressable>
      </ScrollView>
    </SimulatedKeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  deleteButton: {},
  icon: { width: 48, height: 48, fontSize: 36, lineHeight: 48, textAlign: 'center', color: '#b91c1c' },
  form: { flex: 1 },
  fields: { padding: 16, gap: 8 },
  label: { fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#767676', borderRadius: 6, padding: 10, fontSize: 16 },
  save: { marginTop: 8, minHeight: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1d4ed8', borderRadius: 8 },
  saveText: { color: '#ffffff', fontSize: 16 },
});
