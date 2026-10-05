// SaveExpense.jsx: one "Save" press caches the expense, logs it and sends it to the mock service.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { captured, LOCATION_MARK } from './captured.js';
import { device, placesWith, resetPlaces } from './deviceSim.js';

async function saveExpense(expense) {
  const draft = expense; // what gets cached and sent
  await device.cache.setItem(`draft.${expense.id}`, JSON.stringify(draft));
  device.log('debug: saving', JSON.stringify(draft));
  await device.send('/expenses', JSON.stringify(draft));
}

export function SaveExpense() {
  const [found, setFound] = useState(null);

  async function onSave() {
    resetPlaces();
    await saveExpense(captured);
    setFound({ location: placesWith(LOCATION_MARK), label: placesWith(captured.label) });
  }

  return (
    <View style={styles.screen}>
      <Text accessibilityRole="header" style={styles.heading}>{captured.label} · %%amount%%</Text>
      <Pressable accessibilityRole="button" style={styles.button} onPress={onSave}>
        <Text style={styles.buttonText}>%%save%%</Text>
      </Pressable>
      {found && (
        <View style={styles.result}>
          <Text style={styles.count}>%%locationCopies%%: {found.location.length}</Text>
          {found.location.map((place) => (
            <Text key={place} style={styles.place}>• {place}</Text>
          ))}
          <Text style={styles.count}>%%expenseCopies%%: {found.label.length}</Text>
          {found.label.map((place) => (
            <Text key={place} style={styles.place}>• {place}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 12, gap: 10 },
  heading: { fontSize: 18, fontWeight: '700' },
  button: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1d4ed8', borderRadius: 6 },
  buttonText: { color: '#ffffff', fontWeight: '600' },
  result: { gap: 4 },
  count: { fontWeight: '700', marginTop: 6 },
  place: { fontFamily: 'monospace', fontSize: 13, color: '#1f2937' },
});
