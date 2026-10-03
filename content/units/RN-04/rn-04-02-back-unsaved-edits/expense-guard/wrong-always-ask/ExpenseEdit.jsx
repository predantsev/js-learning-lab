import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Alert } from './alertSim.jsx';
import { categories, expenses } from './expenses.js';
import { usePreventRemove } from './navSim.jsx';

export function EditScreen({ navigation, route }) {
  const saved = expenses.useRecords().find((expense) => expense.id === route.params.id);
  const [label, setLabel] = useState(saved.label);
  const [category, setCategory] = useState(saved.category);

  // Misconception: asking every time is the safe default.
  const isDirty = label.trim() !== saved.label || category !== saved.category;

  usePreventRemove(true, ({ data }) => {
    Alert.alert('%%leaveTitle%%', '%%leaveMessage%%', [
      { text: '%%keepEditing%%', style: 'cancel' },
      { text: '%%discard%%', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  return (
    <View style={styles.column}>
      <TextInput accessibilityLabel="%%labelLabel%%" value={label} onChangeText={setLabel} style={styles.input} />
      <View style={styles.chips}>
        {categories.map((option) => (
          <Pressable
            key={option.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: option.id === category }}
            style={[styles.chip, option.id === category && styles.chipOn]}
            onPress={() => setCategory(option.id)}
          >
            <Text>{option.name}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        style={styles.save}
        onPress={() => expenses.update(saved.id, { label: label.trim(), category })}
      >
        <Text>%%save%%</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 8 },
  input: { minHeight: 44, paddingHorizontal: 10, borderWidth: 1, borderColor: '#767676', borderRadius: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#767676', borderRadius: 22 },
  chipOn: { backgroundColor: '#dbe7f7', borderColor: '#0b4fa3' },
  save: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
});
