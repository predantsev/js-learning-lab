// Preview helper (read-only): a SIMULATED Alert with the API shape of React Native's
// Alert.alert(title, message, buttons). In the browser preview React Native's own Alert shows nothing,
// so <SimAlertHost /> draws the dialog inside the page. On a phone the real Alert is a system dialog.
import { useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

let current = null;
const subscribers = new Set();
const notify = () => subscribers.forEach((callback) => callback());

export const Alert = {
  // buttons: [{ text, style?: 'cancel' | 'destructive' | 'default', onPress? }]
  alert(title, message, buttons = [{ text: 'OK' }]) {
    current = { title, message, buttons };
    notify();
  },
};

// For checks: the dialog that is open now, or null; and closing it without pressing a button.
export const openAlert = () => current;
export function dismissAlert() {
  current = null;
  notify();
}

export function SimAlertHost() {
  const dialog = useSyncExternalStore(
    (callback) => {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
    () => current,
  );
  if (dialog === null) return null;
  return (
    <View role="alertdialog" aria-label={dialog.title} style={styles.dialog}>
      <Text style={styles.title}>{dialog.title}</Text>
      {dialog.message ? <Text>{dialog.message}</Text> : null}
      <View style={styles.buttons}>
        {dialog.buttons.map((button) => (
          <Pressable
            key={button.text}
            accessibilityRole="button"
            style={styles.button}
            onPress={() => {
              current = null;
              notify();
              button.onPress?.();
            }}
          >
            <Text style={button.style === 'destructive' ? styles.destructive : null}>{button.text}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dialog: { margin: 12, maxWidth: 380, padding: 16, gap: 8, borderWidth: 2, borderColor: '#3f3f3f', borderRadius: 12, backgroundColor: '#ffffff' },
  title: { fontSize: 17, fontWeight: '600' },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  destructive: { color: '#b91c1c' },
});
