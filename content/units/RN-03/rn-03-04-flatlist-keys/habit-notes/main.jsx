// Each habit row keeps a half-typed note in its own state. Which habit does the note follow?
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const initialHabits = [
  { id: 'h-01', name: '%%exercise%%' },
  { id: 'h-02', name: '%%reading%%' },
  { id: 'h-03', name: '%%water%%' },
];

function HabitRow({ habit }) {
  const [note, setNote] = useState(''); // state of THIS row component
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{habit.name}</Text>
      <TextInput
        accessibilityLabel={`%%note%%: ${habit.name}`}
        placeholder="%%note%%"
        style={styles.input}
        value={note}
        onChangeText={setNote}
      />
    </View>
  );
}

function App() {
  const [habits, setHabits] = useState(initialHabits);
  const [added, setAdded] = useState(0);

  function addAtTop() {
    const next = added + 1;
    setAdded(next);
    setHabits([{ id: `h-new-${next}`, name: `%%walk%% ${next}` }, ...habits]);
  }

  return (
    <View style={styles.screen}>
      <Pressable accessibilityRole="button" style={styles.add} onPress={addAtTop}>
        <Text>%%addTop%%</Text>
      </Pressable>
      <FlatList
        data={habits}
        keyExtractor={(habit, index) => String(index)}
        renderItem={({ item }) => <HabitRow habit={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 12, gap: 8 },
  add: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#4b5563', borderRadius: 6, alignSelf: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  name: { width: 160 },
  input: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: '#4b5563', borderRadius: 6, paddingHorizontal: 8 },
});

createRoot(document.getElementById('root')).render(<App />);
