// Preview plumbing for questions 1, 2 and 4. Everything "device-like" here is SIMULATED:
// native-store.js stands in for an async key-value store (AsyncStorage), navSim.jsx for a
// React Navigation 7 native stack, appStateSim.jsx for React Native's AppState.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppStateControls } from './appStateSim.jsx';
import { DetailScreen, TodayScreen } from './HabitScreens.jsx';
import { createSimulatedStore } from './native-store.js';
import { SimStack, createStack } from './navSim.jsx';
import { PlannerHome } from './PlannerHome.jsx';
import { WishList } from './WishList.jsx';

const store = createSimulatedStore({
  entries: {
    'jsll.wishlist.v1': JSON.stringify({
      schemaVersion: 1,
      records: [
        { id: 'w-01', name: '%%headphones%%', price: 80, acquired: false, category: '%%tech%%' },
        { id: 'w-02', name: '%%lamp%%', price: 45, acquired: false, category: '%%home%%' },
        { id: 'w-04', name: '%%book%%', price: 25, acquired: true, category: '%%books%%' },
      ],
    }),
  },
});

const habitStack = createStack('Today', {
  habits: [
    { id: 'h-01', name: '%%exercise%%' },
    { id: 'h-02', name: '%%reading%%' },
  ],
});

const plannerTasks = [
  { id: 't-1', title: '%%plants%%', dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-2', title: '%%books%%', dueDate: '2026-03-01', done: false, priority: 'high' },
];

function Restartable() {
  const [launch, setLaunch] = useState(1);
  return (
    <View style={styles.section}>
      <View style={styles.phone}>
        <WishList key={launch} storage={store} labels={{ loading: '%%loading%%' }} />
      </View>
      <Pressable
        accessibilityRole="button"
        style={styles.button}
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

function App() {
  return (
    <View style={styles.page}>
      <Text accessibilityRole="header" style={styles.heading}>%%q1%%</Text>
      <Restartable />
      <Text accessibilityRole="header" style={styles.heading}>%%q2%%</Text>
      <SimStack stack={habitStack} screens={{ Today: TodayScreen, Detail: DetailScreen }} />
      <Text accessibilityRole="header" style={styles.heading}>%%q4%%</Text>
      <View style={[styles.phone, styles.padded]}>
        <PlannerHome initialTasks={plannerTasks} today="2026-03-02" labels={{ due: '%%due%%', add: '%%addDue%%', newTask: '%%newTask%%' }} />
      </View>
      <AppStateControls />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 8, gap: 8 },
  heading: { fontSize: 18, fontWeight: '600', marginTop: 8 },
  section: { gap: 8 },
  phone: { maxWidth: 380, borderWidth: 2, borderColor: '#3f3f3f', borderRadius: 16, overflow: 'hidden', backgroundColor: '#ffffff' },
  padded: { padding: 16 },
  button: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#767676', borderRadius: 8 },
});

createRoot(document.getElementById('root')).render(<App />);
