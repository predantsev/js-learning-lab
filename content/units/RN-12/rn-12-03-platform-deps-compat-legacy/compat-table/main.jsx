// main.jsx: finds, for every library, the support row that covers the project's React Native version,
// and shows what each declared target platform gets.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { project } from './project.js';
import { libraries } from './support.js';

const STATUS = {
  new: '%%statusNew%%',
  'legacy-flag': '%%statusLegacyFlag%%',
  interop: '%%statusInterop%%',
};

// '0.86.3' → [0, 86]; compares major.minor only.
const minor = (version) => version.split('.').slice(0, 2).map(Number);
const atLeast = (a, b) => a[0] > b[0] || (a[0] === b[0] && a[1] >= b[1]);
const covers = (row, version) => atLeast(minor(version), minor(row.from)) && atLeast(minor(row.to), minor(version));

function CompatTable() {
  return (
    <View style={styles.page}>
      <Text role="heading" style={styles.heading}>
        React Native {project.reactNative} · {project.targets.join(', ')}
      </Text>
      {libraries.map((library) => {
        const row = library.rows.find((r) => covers(r, project.reactNative));
        return (
          <View key={library.name} style={styles.card}>
            <Text style={styles.name}>{library.name}</Text>
            {project.targets.map((platform) => {
              const status = row ? row[platform] : null;
              return (
                <Text key={platform} style={status === 'new' ? null : styles.warn}>
                  {platform}: {row ? (STATUS[status] ?? '%%statusNone%%') : '%%statusNoRow%%'}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 12, gap: 8, maxWidth: 460 },
  heading: { fontSize: 17, fontWeight: '600' },
  card: { padding: 8, gap: 2, borderWidth: 1, borderColor: '#bdbdbd', borderRadius: 6 },
  name: { fontWeight: '600' },
  warn: { color: '#8a3b00', fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<CompatTable />);
