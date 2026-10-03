// A habit edit screen whose only guard sits on its own header button, on a SIMULATED stack (see navSim.jsx).
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Alert, SimAlertHost } from './alertSim.jsx';
import { SimStack, createStack, usePreventRemove } from './navSim.jsx';
import { createRecordStore } from './recordStore.js';

const habits = createRecordStore([
  { id: 'h-01', name: '%%exercise%%', frequency: 'daily' },
  { id: 'h-02', name: '%%reading%%', frequency: 'daily' },
]);

function ListScreen({ navigation }) {
  return habits.useRecords().map((habit) => (
    <Pressable key={habit.id} accessibilityRole="button" style={styles.row} onPress={() => navigation.push('Edit', { id: habit.id })}>
      <Text>{habit.name}</Text>
    </Pressable>
  ));
}

function EditScreen({ navigation, route }) {
  const saved = habits.useRecords().find((habit) => habit.id === route.params.id);
  const [name, setName] = useState(saved.name);
  const isDirty = name.trim() !== saved.name;

  // The guard sits only on this screen's own header button; the stack's back button is hidden.
  useEffect(() => {
    navigation.setOptions({ headerBackVisible: false });
  }, [navigation]);

  function cancel() {
    if (!isDirty) return navigation.goBack();
    Alert.alert('%%leaveTitle%%', '%%leaveMessage%%', [
      { text: '%%keepEditing%%', style: 'cancel' },
      { text: '%%discard%%', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  }

  return (
    <View style={styles.column}>
      <Pressable accessibilityRole="button" style={styles.row} onPress={cancel}>
        <Text>‹ %%cancel%%</Text>
      </Pressable>
      <TextInput accessibilityLabel="%%nameLabel%%" value={name} onChangeText={setName} style={styles.input} />
      <Pressable accessibilityRole="button" style={styles.row} onPress={() => habits.update(saved.id, { name: name.trim() })}>
        <Text>%%save%%</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 8 },
  row: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  input: { minHeight: 44, paddingHorizontal: 10, borderWidth: 1, borderColor: '#767676', borderRadius: 6 },
});

const stack = createStack('List');
createRoot(document.getElementById('root')).render(
  <>
    <SimStack stack={stack} platform="both" screens={{ List: ListScreen, Edit: EditScreen }} />
    <SimAlertHost />
  </>,
);
