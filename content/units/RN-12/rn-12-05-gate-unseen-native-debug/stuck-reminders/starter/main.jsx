// main.jsx (read-only): the reminder panel on a simulated phone where notifications were allowed.
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createNotifications } from './notifySim.js';
import { ReminderPanel } from './ReminderPanel.jsx';
import { createAppState } from './sim.js';

const appState = createAppState();
const notifications = createNotifications({ granted: true });
const due = [
  { id: 't-01', title: '%%t1%%' },
  { id: 't-02', title: '%%t2%%' },
];

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
      <View style={styles.panel}>
        <ReminderPanel due={due} notifications={notifications} appState={appState} />
      </View>
      <View style={styles.controls}>
        <Button label="%%simLeave%%" onPress={() => appState.leave()} />
        <Button label="%%simRevoke%%" onPress={() => notifications.revoke()} />
        <Button label="%%simAllow%%" onPress={() => notifications.allow()} />
        <Button label="%%simReturn%%" onPress={() => appState.comeBack()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 8, maxWidth: 420 },
  panel: { padding: 16, backgroundColor: '#ffffff' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, margin: 12, padding: 8, borderWidth: 1, borderColor: '#bdbdbd', borderRadius: 8, backgroundColor: '#f2f2f2' },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#767676', borderRadius: 8, backgroundColor: '#ffffff' },
});

createRoot(document.getElementById('root')).render(<Phone />);
