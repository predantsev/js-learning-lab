// The timeline of one expenses request against a slow, flaky server, in the browser preview (react-native-web).
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { modelTimeline } from './retryModel.js';

// What the server does on each attempt: attempt 1 answers after 1200 ms, attempt 2 says 503, attempt 3 is fine.
const SERVER = [
  { answersAfterMs: 1200, status: 200 },
  { answersAfterMs: 100, status: 503 },
  { answersAfterMs: 100, status: 200 },
];

const TIMEOUT_MS = 2000; // try 800
const BLUR_AT_MS = Infinity; // try 1500: the screen loses focus at that moment

const events = modelTimeline(SERVER, { timeoutMs: TIMEOUT_MS, maxAttempts: 3, baseDelayMs: 300, blurAtMs: BLUR_AT_MS });

function Timeline() {
  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>%%heading%%</Text>
      {events.map((event, index) => (
        <View key={index} style={styles.row}>
          <Text style={styles.time}>{`${event.at} ms`}</Text>
          <Text style={styles.text}>{event.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 6 },
  heading: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  row: { flexDirection: 'row', gap: 12 },
  time: { width: 72, textAlign: 'right', fontFamily: 'monospace', color: '#4b4b4b' },
  text: { flexShrink: 1 },
});

createRoot(document.getElementById('root')).render(<Timeline />);
