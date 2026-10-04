// Preview plumbing (read-only): the note as the team would read it.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { note } from './release-note.js';
import { incident, update } from './update.js';

function NoteScreen() {
  const { compatibility: c, ifBroken: b } = note;
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>%%title%% {update.version} (versionCode {update.versionCode})</Text>
      <Text style={styles.label}>%%window%%</Text>
      <Text>Android API ≥ {String(c.minAndroidApi)}, iOS ≥ {String(c.minIos)}, schema v{String(c.schemaWritten)}</Text>
      <Text>%%leftBehind%%: {c.leftBehindAndroidApis.join(', ') || '—'}</Text>
      <Text style={styles.label}>%%incidentLabel%%</Text>
      <Text>{incident}</Text>
      <Text>{String(b.action)} → versionCode {String(b.nextVersionCode)}</Text>
      <Text style={styles.label}>%%cannotUndo%%</Text>
      <Text>{note.cannotUndo.join(', ') || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 4 },
  title: { fontSize: 18, fontWeight: '600' },
  label: { fontWeight: '600', marginTop: 8 },
});

createRoot(document.getElementById('root')).render(<NoteScreen />);
