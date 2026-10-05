// Preview plumbing (read-only): a simulated device store with two expenses and relaunch buttons.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createSimulatedStore } from './native-store.js';
import { ExpensesScreen } from './ExpensesScreen.jsx';

const store = createSimulatedStore({
  readDelayMs: 400,
  entries: {
    'jsll.expenses.v1': JSON.stringify({
      schemaVersion: 1,
      records: [
        { id: 'e-01', label: '%%groceries%%', amountMinor: 84550, date: '2026-03-01', category: 'food' },
        { id: 'e-02', label: '%%transit%%', amountMinor: 52000, date: '2026-03-01', category: 'transport' },
      ],
    }),
  },
});

const labels = { loading: '%%loading%%', empty: '%%empty%%', failed: '%%failed%%', retry: '%%retry%%', add: '%%add%%' };
const lunch = { id: 'e-06', label: '%%lunch%%', amountMinor: 21050, date: '2026-03-02', category: 'food' };

function Simulator() {
  const [launch, setLaunch] = useState(1);
  const relaunch = (failRead) => {
    if (failRead) store.failNextRead();
    setLaunch(launch + 1);
  };
  return (
    <View style={styles.page}>
      <View style={styles.phone}>
        <ExpensesScreen key={launch} storage={store} labels={labels} newExpense={lunch} />
      </View>
      <View style={styles.controls}>
        <Pressable role="button" style={styles.button} onPress={() => relaunch(false)}>
          <Text>%%relaunch%%</Text>
        </Pressable>
        <Pressable role="button" style={styles.button} onPress={() => relaunch(true)}>
          <Text>%%relaunchFailing%%</Text>
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
});

createRoot(document.getElementById('root')).render(<Simulator />);
