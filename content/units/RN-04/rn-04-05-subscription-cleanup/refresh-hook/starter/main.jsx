// Read-only: a habits app on a SIMULATED stack and AppState (see navSim.jsx and appStateSim.jsx).
// The Today screen refreshes the chosen habit's summary through useAppStateRefresh.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppStateControls } from './appStateSim.jsx';
import { SimStack, createStack } from './navSim.jsx';
import { useAppStateRefresh } from './useAppStateRefresh.js';

// Every refresh is recorded here: which habit it was made for.
export const refreshes = [];

function HomeScreen({ navigation }) {
  return (
    <Pressable accessibilityRole="button" style={styles.button} onPress={() => navigation.push('Today')}>
      <Text>%%openToday%%</Text>
    </Pressable>
  );
}

function TodayScreen({ navigation }) {
  const [habitId, setHabitId] = useState('h-01');
  const [count, setCount] = useState(0);
  useAppStateRefresh(() => {
    refreshes.push(habitId);
    setCount(refreshes.length);
  });
  return (
    <View style={styles.column}>
      <Text>
        %%chosen%% {habitId === 'h-01' ? '%%exercise%%' : '%%water%%'}
      </Text>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => setHabitId(habitId === 'h-01' ? 'h-03' : 'h-01')}>
        <Text>%%switchHabit%%</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => navigation.push('History')}>
        <Text>%%openHistory%%</Text>
      </Pressable>
      <Text>
        %%refreshCount%% {count}
      </Text>
    </View>
  );
}

function HistoryScreen() {
  return <Text>%%historyText%%</Text>;
}

const styles = StyleSheet.create({
  column: { gap: 8 },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#767676', borderRadius: 8 },
});

export const stack = createStack('Home');
createRoot(document.getElementById('root')).render(
  <>
    <SimStack stack={stack} screens={{ Home: HomeScreen, Today: TodayScreen, History: HistoryScreen }} />
    <AppStateControls />
  </>,
);
