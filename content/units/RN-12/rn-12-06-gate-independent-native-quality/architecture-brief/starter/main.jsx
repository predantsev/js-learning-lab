// main.jsx (read-only): shows your evidence records with the status judge() gives them. It does not grade the rest.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { build, declaredTarget } from './build.js';
import { iosReaderSkip, restartRecord, routes, spikeFirst, trace } from './brief.js';
import { judge } from './evidence.js';

function Brief() {
  const records = { restartRecord, iosReaderSkip };
  return (
    <View style={styles.page}>
      {Object.entries(records).map(([name, record]) => {
        const verdict = judge(record, { declaredTarget, build });
        return (
          <Text key={name} style={styles.line}>
            {name}: {verdict.status}
            {verdict.reason ? ` (${verdict.reason})` : ''}
          </Text>
        );
      })}
      <Text style={styles.line}>trace: {String(trace?.cheaper || '—')} · {String(trace?.times ?? '—')}</Text>
      {Object.keys(routes ?? {}).map((id) => (
        <Text key={id}>
          {id}: {routes[id] || '—'} · spike {String(spikeFirst?.[id] ?? '—')}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 12, gap: 6, maxWidth: 460 },
  line: { fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<Brief />);
