// A one-field habit form in the browser preview (react-native-web).
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { validateHabit } from './domain.js';
import { FormField } from './FormField.jsx';

const MESSAGES = { nameRequired: "%%nameRequired%%", nameTooLong: "%%nameTooLong%%" };

function HabitForm() {
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  function save() {
    const result = validateHabit({ name, frequency: 'daily' });
    if (result.ok) {
      setError(null);
      console.log('%%saved%%', result.value.name);
    } else {
      setError(MESSAGES[result.errors.name]);
    }
  }
  return (
    <View style={styles.form}>
      <FormField label="%%name%%" value={name} onChangeText={setName} error={error} />
      <Pressable accessibilityRole="button" onPress={save} style={styles.save}>
        <Text style={styles.saveText}>%%save%%</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: 16, gap: 12, maxWidth: 360 },
  save: { minHeight: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1d4ed8', borderRadius: 8 },
  saveText: { color: '#ffffff', fontSize: 16 },
});

createRoot(document.getElementById('root')).render(<HabitForm />);
