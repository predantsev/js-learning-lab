// Shows the crash report and your notes. Do not edit.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { crashReport } from './crashReport.js';
import { diagnosis } from './diagnosis.js';

function ReportScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.heading} role="heading">%%report%%</Text>
        <Text>{crashReport.app} · {crashReport.device}</Text>
        <Text style={styles.error}>{crashReport.error}</Text>
        {crashReport.stack.map((frame) => <Text key={frame} style={styles.mono}>{frame}</Text>)}
        {crashReport.breadcrumbs.map((crumb) => <Text key={crumb}>{crumb}</Text>)}
      </View>
      <View style={styles.card}>
        <Text style={styles.heading} role="heading">%%notes%%</Text>
        {diagnosis.steps.map((step, index) => <Text key={index}>{index + 1}. {step}</Text>)}
        <Text>%%ownFrame%%: {diagnosis.firstOwnFrame || '—'}</Text>
        <Text>%%hypothesis%%: {diagnosis.hypothesis || '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 8, gap: 10 },
  card: { padding: 10, gap: 3, borderWidth: 1, borderColor: '#6b7280', borderRadius: 6 },
  heading: { fontSize: 16, fontWeight: '600' },
  error: { color: '#b91c1c', fontWeight: '600' },
  mono: { fontFamily: 'monospace', fontSize: 11 },
});

createRoot(document.getElementById('root')).render(<ReportScreen />);
