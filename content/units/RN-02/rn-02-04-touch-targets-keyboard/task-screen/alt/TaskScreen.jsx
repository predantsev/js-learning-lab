import { Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useSimulatedKeyboard } from './SimulatedKeyboard.jsx';

// Another valid approach: a fixed 48 × 48 box centres the icon, and the scrolling form gets
// extra bottom padding as tall as the keyboard, so its end can be scrolled above the keyboard.
export function DeleteButton({ label, onPress }) {
  return (
    <Pressable testID="delete" role="button" accessibilityLabel={label} onPress={onPress} style={styles.deleteButton}>
      <Text testID="delete-icon" style={styles.icon}>✕</Text>
    </Pressable>
  );
}

export function TaskForm() {
  const keyboard = useSimulatedKeyboard();
  return (
    <ScrollView style={styles.form} contentContainerStyle={[styles.fields, { paddingBottom: 16 + keyboard.height }]}>
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
  );
}

const styles = StyleSheet.create({
  deleteButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 24, height: 24, fontSize: 18, lineHeight: 24, textAlign: 'center', color: '#b91c1c' },
  form: { flex: 1 },
  fields: { padding: 16, gap: 8 },
  label: { fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#767676', borderRadius: 6, padding: 10, fontSize: 16 },
  save: { marginTop: 8, minHeight: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1d4ed8', borderRadius: 8 },
  saveText: { color: '#ffffff', fontSize: 16 },
});
