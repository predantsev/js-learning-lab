// The habits list loaded from each simulated target, side by side, in the browser preview (react-native-web).
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { createMockSource } from './source.js';
import { TARGETS, fetchFrom } from './targetSim.js';

export const habits = [
  { id: 'h-01', name: '%%exercise%%' },
  { id: 'h-02', name: '%%reading%%' },
  { id: 'h-03', name: '%%water%%' },
];
// The routes from the lesson: adb reverse for the USB phone, a LAN listener for Wi-Fi.
export const routes = { reversed: true, lan: true, records: habits };

function TargetRow({ target }) {
  const [line, setLine] = useState('…');
  useEffect(() => {
    createMockSource(target, fetchFrom(target, routes)).list().then(
      (list) => setLine(`${list.length} %%habits%%`),
      (error) => setLine(`${error.name}: ${error.message}`),
    );
  }, [target]);
  return (
    <View style={styles.row} testID={target}>
      <Text style={styles.target}>{target}</Text>
      <Text>{line}</Text>
    </View>
  );
}

function App() {
  return (
    <View style={styles.screen}>
      {TARGETS.map((target) => <TargetRow key={target} target={target} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 8 },
  row: { padding: 8, borderWidth: 1, borderColor: '#767676', borderRadius: 6, gap: 2 },
  target: { fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<App />);
