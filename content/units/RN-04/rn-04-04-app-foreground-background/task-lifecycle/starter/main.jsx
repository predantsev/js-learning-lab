// Read-only: a planner edit screen that uses watchLifecycle, with a SIMULATED AppState (see appStateSim.jsx).
import { useEffect, useEffectEvent, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppState, AppStateControls } from './appStateSim.jsx';
import { countDueTasks } from './domain.js';
import { watchLifecycle } from './lifecycle.js';

const tasks = [
  { id: 't-01', title: '%%plants%%', dueDate: '2026-03-02', done: false },
  { id: 't-02', title: '%%books%%', dueDate: '2026-03-01', done: false },
  { id: 't-05', title: '%%dentist%%', dueDate: '2026-03-10', done: false },
];

// A clock adapter and a draft store, both simulated.
let simulatedToday = '2026-03-01';
const clock = { today: () => simulatedToday };
export const savedDrafts = [];

function EditScreen() {
  const [title, setTitle] = useState('%%books%%');
  const [today, setToday] = useState(clock.today());
  const [savedCount, setSavedCount] = useState(0);
  const saveDraft = useEffectEvent(() => {
    savedDrafts.push(title);
    setSavedCount(savedDrafts.length);
  });
  const refreshToday = useEffectEvent(() => setToday(clock.today()));

  useEffect(() => watchLifecycle(AppState, { saveDraft: () => saveDraft(), refreshToday: () => refreshToday() }), []);

  return (
    <View style={styles.screen}>
      <Text>
        %%dueToday%% {countDueTasks(tasks, today)} ({today})
      </Text>
      <TextInput accessibilityLabel="%%titleLabel%%" value={title} onChangeText={setTitle} style={styles.input} />
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => (simulatedToday = '2026-03-02')}>
        <Text>%%midnight%%</Text>
      </Pressable>
      <Text testID="drafts">
        %%draftsLabel%% {savedCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { margin: 12, maxWidth: 380, padding: 16, gap: 8, borderWidth: 2, borderColor: '#3f3f3f', borderRadius: 16, backgroundColor: '#ffffff' },
  input: { minHeight: 44, paddingHorizontal: 10, borderWidth: 1, borderColor: '#767676', borderRadius: 6 },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#767676', borderRadius: 8 },
});

createRoot(document.getElementById('root')).render(
  <>
    <EditScreen />
    <AppStateControls />
  </>,
);
