// Today's habit summary with a SIMULATED AppState (see appStateSim.jsx) and a simulated clock.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppState, AppStateControls } from './appStateSim.jsx';

const habits = [
  { id: 'h-01', name: '%%exercise%%', completions: ['2026-02-28', '2026-03-01'] },
  { id: 'h-02', name: '%%reading%%', completions: ['2026-03-01'] },
  { id: 'h-03', name: '%%water%%', completions: ['2026-03-01', '2026-03-02'] },
];

// A clock adapter: the screen asks it for today instead of reading the device clock directly.
let simulatedToday = '2026-03-01';
const clock = { today: () => simulatedToday };

const doneOn = (day) => habits.filter((habit) => habit.completions.includes(day)).length;

function TodayScreen() {
  const [today, setToday] = useState(clock.today());

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      console.log(`AppState: ${next}`);
    });
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>
        %%todayLabel%% {today}
      </Text>
      <Text>
        %%doneLabel%% {doneOn(today)} / {habits.length}
      </Text>
      <Pressable
        accessibilityRole="button"
        style={styles.button}
        onPress={() => {
          simulatedToday = '2026-03-02';
        }}
      >
        <Text>%%midnight%%</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { margin: 12, maxWidth: 380, padding: 16, gap: 8, borderWidth: 2, borderColor: '#3f3f3f', borderRadius: 16, backgroundColor: '#ffffff' },
  title: { fontSize: 18, fontWeight: '600' },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#767676', borderRadius: 8 },
});

createRoot(document.getElementById('root')).render(
  <>
    <TodayScreen />
    <AppStateControls />
  </>,
);
