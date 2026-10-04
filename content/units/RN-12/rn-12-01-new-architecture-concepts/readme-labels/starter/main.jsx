// main.jsx (read-only): shows the README items with your labels and your notes. It does not grade them.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { labels, notes } from './labels.js';
import { readme } from './readme.js';

function Answers() {
  return (
    <View style={styles.page}>
      <Text role="heading" style={styles.heading}>README · step-sensor 3.0</Text>
      {readme.map((item) => (
        <View key={item.id} style={styles.item}>
          <Text style={styles.tag}>
            {item.id}: {labels?.[item.id] || '—'}
          </Text>
          <Text>{item.text}</Text>
        </View>
      ))}
      <Text role="heading" style={styles.heading}>%%notesHeading%%</Text>
      {(Array.isArray(notes) ? notes : []).map((note, index) => (
        <View key={index} style={styles.item}>
          <Text style={styles.tag}>
            {note?.box || '—'} · React Native {note?.version || '—'}
          </Text>
          <Text>{note?.text || '—'}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 12, gap: 8, maxWidth: 460 },
  heading: { fontSize: 17, fontWeight: '600' },
  item: { padding: 8, gap: 2, borderWidth: 1, borderColor: '#bdbdbd', borderRadius: 6 },
  tag: { fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<Answers />);
