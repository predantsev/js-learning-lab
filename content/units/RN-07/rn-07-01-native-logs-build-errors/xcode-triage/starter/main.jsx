// Shows the Xcode log and your triage note side by side. Do not edit.
import { createRoot } from 'react-dom/client';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { xcodeLog } from './xcodeLog.js';
import { triage } from './triage.js';

function TriageScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView style={styles.log}>
        {xcodeLog.map((line, index) => (
          <Text key={index} style={styles.line}>{line}</Text>
        ))}
      </ScrollView>
      <View style={styles.card}>
        <Text style={styles.heading} role="heading">%%note%%</Text>
        <Text>%%fFirst%%: {triage.firstErrorLine || '—'}</Text>
        <Text>%%fFile%%: {triage.file || '—'}</Text>
        <Text>%%fKind%%: {triage.kind || '—'}</Text>
        <Text>%%fNext%%: {triage.nextCommand || '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 8, gap: 10 },
  log: { maxHeight: 280, borderWidth: 1, borderColor: '#6b7280', padding: 4 },
  line: { fontFamily: 'monospace', fontSize: 11 },
  card: { padding: 10, gap: 4, borderWidth: 1, borderColor: '#1d4ed8', borderRadius: 6 },
  heading: { fontSize: 16, fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<TriageScreen />);
