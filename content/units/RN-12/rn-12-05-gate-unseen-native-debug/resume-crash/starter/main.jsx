// main.jsx (read-only): the planner on a simulated phone: leave the app, let midnight pass, come back.
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PlannerScreen } from './PlannerScreen.jsx';
import { createAppState, createDeviceClock } from './sim.js';

const appState = createAppState();
const clock = createDeviceClock('2026-03-01');

function Button({ label, onPress }) {
  return (
    <Pressable accessibilityRole="button" style={styles.button} onPress={onPress}>
      <Text>{label}</Text>
    </Pressable>
  );
}

function Phone() {
  return (
    <View style={styles.page}>
      <PlannerScreen appState={appState} clock={clock} />
      <View style={styles.controls}>
        <Button label="%%simLeave%%" onPress={() => appState.leave()} />
        <Button label="%%simMidnight%%" onPress={() => clock.setDay('2026-03-02')} />
        <Button label="%%simReturn%%" onPress={() => appState.comeBack()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 8, maxWidth: 420 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, margin: 12, padding: 8, borderWidth: 1, borderColor: '#bdbdbd', borderRadius: 8, backgroundColor: '#f2f2f2' },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#767676', borderRadius: 8, backgroundColor: '#ffffff' },
});

createRoot(document.getElementById('root')).render(<Phone />);
