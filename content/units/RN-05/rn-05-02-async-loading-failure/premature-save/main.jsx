// Preview plumbing: a simulated device store and two buttons that relaunch the app.
// "Relaunch" unmounts the whole app and mounts it again: React state is gone, the store stays.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createSimulatedStore } from './native-store.js';
import { HabitsScreen } from './HabitsScreen.jsx';

const store = createSimulatedStore({
  readDelayMs: 300,
  entries: {
    'jsll.habits.v1': JSON.stringify({
      schemaVersion: 1,
      records: [
        { id: 'h-01', name: '%%exercise%%', frequency: 'daily', active: true, completions: [] },
        { id: 'h-02', name: '%%reading%%', frequency: 'daily', active: true, completions: [] },
        { id: 'h-03', name: '%%water%%', frequency: 'daily', active: true, completions: [] },
      ],
    }),
  },
});

const labels = { title: '%%title%%', empty: '%%empty%%' };

function Simulator() {
  const [launch, setLaunch] = useState(1);
  const relaunch = (failRead) => {
    if (failRead) store.failNextRead();
    console.log(`--- ${failRead ? '%%relaunchFailing%%' : '%%relaunch%%'} ---`);
    setLaunch(launch + 1);
  };
  return (
    <View style={styles.page}>
      <View style={styles.phone}>
        <HabitsScreen key={launch} storage={store} labels={labels} />
      </View>
      <View style={styles.controls}>
        <Pressable role="button" style={styles.button} onPress={() => relaunch(false)}>
          <Text style={styles.buttonText}>%%relaunch%%</Text>
        </Pressable>
        <Pressable role="button" style={styles.button} onPress={() => relaunch(true)}>
          <Text style={styles.buttonText}>%%relaunchFailing%%</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 8, gap: 12 },
  phone: { borderWidth: 2, borderColor: '#3d3d3d', borderRadius: 16, minHeight: 220 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#e5e7eb', borderRadius: 6 },
  buttonText: { color: '#111827' },
});

createRoot(document.getElementById('root')).render(<Simulator />);
