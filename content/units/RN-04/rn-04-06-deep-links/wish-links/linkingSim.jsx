// Preview helper (read-only): a SIMULATED Linking with the API shape of React Native's Linking.
// On a phone the operating system delivers a link in one of two ways: a link that STARTS the app
// is read with Linking.getInitialURL(); a link that arrives while the app is running comes as a
// 'url' event. <LinkControls /> sends synthetic links both ways.
import { Pressable, StyleSheet, Text, View } from 'react-native';

const listeners = new Set();
let initialUrl = null;

export const Linking = {
  // Resolves with the link that started the app, or null when it was started normally.
  getInitialURL: () => Promise.resolve(initialUrl),
  // Calls handler({ url }) for every link that arrives while the app is running.
  addEventListener(type, handler) {
    if (type !== 'url') throw new Error(`This simulation only has the 'url' event, not '${type}'`);
    const entry = { handler };
    listeners.add(entry);
    return { remove: () => listeners.delete(entry) };
  },
};

// The app is running and a link arrives.
export function sendLink(url) {
  for (const entry of [...listeners]) entry.handler({ url });
}
// The app is closed and a link starts it: the next getInitialURL() answers with this url.
export function setInitialURL(url) {
  initialUrl = url;
}
// For checks: how many 'url' listeners are subscribed right now.
export const linkListenerCount = () => listeners.size;

// links: [{ label, url }]; onColdStart(url) must start the app again from scratch.
export function LinkControls({ links, onColdStart }) {
  return (
    <View style={styles.bar}>
      <Text style={styles.label}>%%simLinks%%</Text>
      {links.map((link) => (
        <View key={link.url} style={styles.link}>
          <Text style={styles.url}>
            {link.label}: {link.url}
          </Text>
          <View style={styles.buttons}>
            <Pressable accessibilityRole="button" accessibilityLabel={`%%simSendRunning%%: ${link.label}`} style={styles.button} onPress={() => sendLink(link.url)}>
              <Text>%%simSendRunning%%</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`%%simColdStart%%: ${link.label}`}
              style={styles.button}
              onPress={() => {
                setInitialURL(link.url);
                onColdStart(link.url);
              }}
            >
              <Text>%%simColdStart%%</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { margin: 12, maxWidth: 380, padding: 8, gap: 8, borderWidth: 1, borderColor: '#bdbdbd', borderRadius: 8, backgroundColor: '#f2f2f2' },
  label: { fontSize: 13, color: '#3f3f3f' },
  link: { gap: 4 },
  url: { fontSize: 13, fontFamily: 'monospace' },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#767676', borderRadius: 8, backgroundColor: '#ffffff' },
});
