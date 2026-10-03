// The habits screen's status banner in every situation, side by side, in the browser preview (react-native-web).
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBanner } from './StatusBanner.jsx';

const CASES = [null, 'offline', 'timeout', 'server', 'invalid'];

// One situation: the banner above the last loaded habits, and counters for the two actions.
function Case({ failure }) {
  const [retries, setRetries] = useState(0);
  const [bundled, setBundled] = useState(0);
  return (
    <View style={styles.case} testID={`case-${failure ?? 'none'}`}>
      <Text style={styles.label}>{`failure: ${failure}`}</Text>
      <StatusBanner failure={failure} onRetry={() => setRetries((n) => n + 1)} onUseBundled={() => setBundled((n) => n + 1)} />
      <Text>%%exercise%% · %%reading%%</Text>
      <Text style={styles.counters} testID={`counters-${failure ?? 'none'}`}>{`retry: ${retries} · bundled: ${bundled}`}</Text>
    </View>
  );
}

function App() {
  return (
    <View style={styles.screen}>
      {CASES.map((failure) => <Case key={String(failure)} failure={failure} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 12 },
  case: { gap: 6, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  label: { fontFamily: 'monospace', color: '#4b4b4b' },
  counters: { fontSize: 13, color: '#4b4b4b' },
});

createRoot(document.getElementById('root')).render(<App />);
