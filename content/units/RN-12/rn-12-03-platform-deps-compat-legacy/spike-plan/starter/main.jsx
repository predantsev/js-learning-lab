// main.jsx (read-only): shows your plan next to the requests. It does not grade it.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { noteSort, routes, spikeFirst, spikePlan } from './plan.js';
import { migrationNote, requests } from './request.js';

const show = (value) => (value === '' || value === null || value === undefined ? '—' : String(value));

function Plan() {
  return (
    <View style={styles.page}>
      {Object.entries(requests).map(([id, text]) => (
        <View key={id} style={styles.card}>
          <Text style={styles.name}>{id}</Text>
          <Text>{text}</Text>
          <Text>
            → {show(routes?.[id])} · %%spikeLabel%%: {show(spikeFirst?.[id])}
          </Text>
        </View>
      ))}
      <View style={styles.card}>
        <Text style={styles.name}>%%planHeading%%</Text>
        {Object.entries(spikePlan ?? {}).map(([key, value]) => (
          <Text key={key}>
            {key}: {Array.isArray(value) ? value.join(', ') || '—' : show(value)}
          </Text>
        ))}
      </View>
      {migrationNote.map((line) => (
        <Text key={line.id}>
          {line.id}. {line.text} → {show(noteSort?.[line.id])}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 12, gap: 8, maxWidth: 480 },
  card: { padding: 8, gap: 2, borderWidth: 1, borderColor: '#bdbdbd', borderRadius: 6 },
  name: { fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<Plan />);
