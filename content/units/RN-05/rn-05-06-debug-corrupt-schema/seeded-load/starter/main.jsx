// Preview plumbing (read-only): a simulated device store and four seeded snapshots to launch with.
// A crash inside the "phone" is caught here and shown in place of the screen, as a device would stop.
import { Component, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createSimulatedStore } from './native-store.js';
import { TasksScreen } from './TasksScreen.jsx';

const KEY = 'jsll.planner.v1';
const seeds = {
  valid: JSON.stringify({
    schemaVersion: 1,
    records: [
      { id: 't-01', title: '%%plants%%', dueDate: '2026-03-02', done: false, priority: 'normal' },
      { id: 't-06', title: '%%wardrobe%%', dueDate: '2026-03-05', done: true, priority: 'low' },
    ],
  }),
  outdated: JSON.stringify({
    schemaVersion: 0,
    records: [
      { id: 't-02', title: '%%books%%', dueDate: '2026-03-01', status: 'open', priority: 'high' },
      { id: 't-04', title: '%%internet%%', dueDate: '2026-02-27', status: 'done', priority: 'high' },
    ],
  }),
  truncated: '{"schemaVersion":1,"records":[{"id":"t-03","title":"%%grandma%%","dueD',
  wrongShape: JSON.stringify({ schemaVersion: 1, records: { 't-05': { title: '%%dentist%%', done: false } } }),
};

const store = createSimulatedStore({ readDelayMs: 300, entries: { [KEY]: seeds.valid } });
const labels = {
  loading: '%%loading%%',
  failed: '%%failed%%',
  empty: '%%empty%%',
  recovered: '%%recovered%%',
};

class Crash extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) return <Text style={styles.crash}>{`%%crashed%% ${this.state.error.name}: ${this.state.error.message}`}</Text>;
    return this.props.children;
  }
}

function Simulator() {
  const [launch, setLaunch] = useState(1);
  const launchWith = (name) => {
    store.reset({ [KEY]: seeds[name] });
    console.log(`--- ${name} ---`);
    setLaunch(launch + 1);
  };
  return (
    <View style={styles.page}>
      <View style={styles.phone}>
        <Crash key={launch}>
          <TasksScreen storage={store} labels={labels} />
        </Crash>
      </View>
      <View style={styles.controls}>
        {Object.keys(seeds).map((name) => (
          <Pressable key={name} role="button" style={styles.button} onPress={() => launchWith(name)}>
            <Text>{`%%launchWith%% ${name}`}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 8, gap: 12 },
  phone: { borderWidth: 2, borderColor: '#3d3d3d', borderRadius: 16, minHeight: 200 },
  crash: { padding: 16, color: '#991b1b' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#e5e7eb', borderRadius: 6 },
});

createRoot(document.getElementById('root')).render(<Simulator />);
