// Preview helper (read-only): a SIMULATED AppState with the API shape of React Native's AppState.
// In the browser preview React Native's own AppState only follows the tab's visibility, so the
// buttons of <AppStateControls /> send the changes a phone would send. The sequences follow the
// React Native 0.86 source: iOS leaving the app sends 'inactive' then 'background'; Android sends
// only 'background'; coming back sends 'active' on both.
import { useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const listeners = new Set();
const watchers = new Set();
let current = 'active';

export const AppState = {
  get currentState() {
    return current;
  },
  // Returns a subscription whose remove() stops this listener, as in React Native.
  addEventListener(type, handler) {
    if (type !== 'change') throw new Error(`This simulation only has the 'change' event, not '${type}'`);
    const entry = { handler };
    listeners.add(entry);
    return { remove: () => listeners.delete(entry) };
  },
};

export function simulateAppState(next) {
  if (next === current) return;
  current = next;
  for (const entry of [...listeners]) entry.handler(next);
  watchers.forEach((notify) => notify());
}
export const leaveApp = (platform) => {
  if (platform === 'ios') simulateAppState('inactive');
  simulateAppState('background');
};
export const returnToApp = () => simulateAppState('active');
// For checks: how many 'change' listeners are subscribed right now.
export const appStateListenerCount = () => listeners.size;

export function AppStateControls() {
  const state = useSyncExternalStore(
    (notify) => {
      watchers.add(notify);
      return () => watchers.delete(notify);
    },
    () => current,
  );
  return (
    <View style={styles.bar}>
      <Text style={styles.label}>%%simAppState%%: {state}</Text>
      <View style={styles.buttons}>
        <Pressable accessibilityRole="button" style={styles.button} onPress={() => leaveApp('ios')}>
          <Text>%%simLeaveIos%%</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.button} onPress={() => leaveApp('android')}>
          <Text>%%simLeaveAndroid%%</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.button} onPress={returnToApp}>
          <Text>%%simReturn%%</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { margin: 12, maxWidth: 380, padding: 8, gap: 6, borderWidth: 1, borderColor: '#bdbdbd', borderRadius: 8, backgroundColor: '#f2f2f2' },
  label: { fontSize: 13, color: '#3f3f3f' },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#767676', borderRadius: 8, backgroundColor: '#ffffff' },
});
