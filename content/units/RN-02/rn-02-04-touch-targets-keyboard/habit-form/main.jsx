// A habit row with a small delete icon and a habit form, in a SIMULATED screen with the keyboard open.
import { createRoot } from 'react-dom/client';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardFrame, SimulatedKeyboardAvoidingView } from './SimulatedKeyboard.jsx';

function HabitScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.row}>
        <Text style={styles.rowText}>%%water%%</Text>
        {/* The dashed border shows the touch area of the button. */}
        <Pressable role="button" accessibilityLabel="%%remove%%" style={styles.deleteButton} onPress={() => console.log('%%removed%%')}>
          <Text style={styles.icon}>✕</Text>
        </Pressable>
      </View>
      <View style={styles.form}>
        <ScrollView contentContainerStyle={styles.fields}>
          <Text style={styles.label}>%%name%%</Text>
          <TextInput style={styles.input} />
          <Text style={styles.label}>%%frequency%%</Text>
          <TextInput style={styles.input} />
          <Text style={styles.label}>%%note%%</Text>
          <TextInput style={styles.input} />
          <Pressable role="button" style={styles.save}>
            <Text style={styles.saveText}>%%save%%</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  rowText: { fontSize: 16 },
  deleteButton: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#b91c1c' },
  icon: { width: 24, height: 24, fontSize: 18, lineHeight: 24, textAlign: 'center', color: '#b91c1c' },
  form: { flex: 1 },
  fields: { padding: 16, gap: 8 },
  label: { fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#767676', borderRadius: 6, padding: 10, fontSize: 16 },
  save: { marginTop: 8, minHeight: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1d4ed8', borderRadius: 8 },
  saveText: { color: '#ffffff', fontSize: 16 },
});

createRoot(document.getElementById('root')).render(
  <KeyboardFrame>
    <HabitScreen />
  </KeyboardFrame>,
);
