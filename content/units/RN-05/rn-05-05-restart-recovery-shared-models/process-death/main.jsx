// Preview plumbing: the planner on a simulated device store, plus a button that simulates
// process death — the whole app is unmounted and started again; only the store survives.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createSimulatedStore } from './native-store.js';
import { PlannerApp } from './PlannerApp.jsx';

const store = createSimulatedStore({
  readDelayMs: 200,
  entries: {
    'jsll.planner.v1': JSON.stringify({
      schemaVersion: 1,
      records: [{ id: 't-01', title: '%%plants%%', dueDate: '2026-03-02', done: false, priority: 'normal' }],
    }),
  },
});
const labels = { loading: '%%loading%%', newTask: '%%newTask%%', add: '%%add%%' };

function Simulator() {
  const [launch, setLaunch] = useState(1);
  return (
    <View style={styles.page}>
      <View style={styles.phone}>
        <PlannerApp key={launch} storage={store} labels={labels} />
      </View>
      <Pressable
        role="button"
        style={styles.kill}
        onPress={() => {
          console.log('--- %%killed%% ---');
          setLaunch(launch + 1);
        }}
      >
        <Text>%%kill%%</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 8, gap: 12 },
  phone: { borderWidth: 2, borderColor: '#3d3d3d', borderRadius: 16, minHeight: 220 },
  kill: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#e5e7eb', borderRadius: 6 },
});

createRoot(document.getElementById('root')).render(<Simulator />);
