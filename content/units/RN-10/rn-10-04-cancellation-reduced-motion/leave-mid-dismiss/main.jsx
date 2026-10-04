// A habit screen: "Done today" slides the row out over 1 s. "Leave the screen" unmounts the screen mid-way.
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SimulatedAccessibilityInfo, setReduceMotion } from './motionSettings.js';

// Reads the setting once, when the screen mounts. A later change of the setting is not seen.
function useReduceMotionAtMount() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    SimulatedAccessibilityInfo.isReduceMotionEnabled().then(setReduced);
  }, []);
  return reduced;
}

function HabitRow({ habit, reduced, onDone }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const running = useRef(null);

  // Cleanup: when the row unmounts, stop whatever animation is still running.
  useEffect(() => () => running.current?.stop(), []);

  function markDone() {
    const animation = reduced
      ? Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: false }) // fade only
      : Animated.timing(translateX, { toValue: -320, duration: 1000, useNativeDriver: false });
    running.current = animation;
    console.log(`${habit.id}: ${reduced ? 'fade' : 'slide'} started`);
    animation.start(({ finished }) => {
      console.log(`${habit.id}: completion, finished: ${finished}`);
      if (finished) onDone(habit.id);
    });
  }

  return (
    <Animated.View style={[styles.row, { opacity, transform: [{ translateX }] }]}>
      <Text style={styles.name}>{habit.name}</Text>
      <Pressable accessibilityRole="button" onPress={markDone} style={styles.small}>
        <Text>%%done%%</Text>
      </Pressable>
    </Animated.View>
  );
}

function HabitScreen() {
  const reduced = useReduceMotionAtMount();
  const [habits, setHabits] = useState([
    { id: 'h-01', name: '%%exercise%%' },
    { id: 'h-03', name: '%%water%%' },
  ]);
  function handleDone(id) {
    console.log(`${id}: onDone → removed from the list`);
    setHabits((current) => current.filter((habit) => habit.id !== id));
  }
  return habits.map((habit) => <HabitRow key={habit.id} habit={habit} reduced={reduced} onDone={handleDone} />);
}

function App() {
  const [onScreen, setOnScreen] = useState(true);
  const [osSetting, setOsSetting] = useState(false);
  return (
    <View style={styles.screen}>
      {onScreen ? <HabitScreen /> : <Text>%%otherScreen%%</Text>}
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => {
        console.log(onScreen ? '--- leaving the screen ---' : '--- back on the screen ---');
        setOnScreen(!onScreen);
      }}>
        <Text style={styles.buttonText}>{onScreen ? '%%leave%%' : '%%back%%'}</Text>
      </Pressable>
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: osSetting }} style={styles.button} onPress={() => {
        setReduceMotion(!osSetting);
        setOsSetting(!osSetting);
        console.log(`--- OS setting "reduce motion": ${!osSetting} ---`);
      }}>
        <Text style={styles.buttonText}>%%osSetting%%: {osSetting ? '%%on%%' : '%%off%%'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 12, gap: 8, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12, borderWidth: 1, borderColor: '#4b5563', borderRadius: 6, backgroundColor: '#ffffff' },
  name: { flex: 1, fontSize: 16 },
  small: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  button: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#1d4ed8', borderRadius: 6 },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<App />);
