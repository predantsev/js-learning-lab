// The labeled matrix preview: what every feature still needs on each column.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { columns, features } from './coverage.js';
import { workstation } from './workstation.js';

const HEAD = { host: '%%cHost%%', target: '%%cTarget%%', other: '%%cOther%%' };
const MARK = { verified: '✓ %%mVerified%%', evidence: '≈ %%mEvidence%%', unperformed: '○ %%mTodo%%', 'n/a': '— %%mNa%%', skip: '⊘ %%mSkip%%' };

// An unperformed cell on a platform this workstation cannot run becomes a skip record.
function cellState(feature, column) {
  const value = feature[column];
  if (column === 'other' && value === 'unperformed' && workstation.otherPlatform === 'unsupported') return 'skip';
  return value;
}

const needSkip = features.filter((feature) => cellState(feature, 'other') === 'skip').map((feature) => feature.name);
const toDo = features.flatMap((feature) => columns.filter((column) => cellState(feature, column) === 'unperformed').map((column) => `${feature.name} · ${HEAD[column]}`));
console.log(`%%skipRows%%: ${needSkip.length ? needSkip.join('; ') : '—'}`);
console.log(`%%todoCells%%: ${toDo.length ? toDo.join('; ') : '—'}`);

function Matrix() {
  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <Text style={[styles.cell, styles.head]}>%%cFeature%%</Text>
        {columns.map((column) => <Text key={column} style={[styles.cell, styles.head]}>{HEAD[column]}</Text>)}
      </View>
      {features.map((feature) => (
        <View key={feature.id} style={styles.row}>
          <Text style={[styles.cell, styles.head]}>{feature.name}</Text>
          {columns.map((column) => <Text key={column} style={styles.cell}>{MARK[cellState(feature, column)]}</Text>)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: { padding: 8 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#6b7280' },
  cell: { flex: 1, padding: 6, fontSize: 13 },
  head: { fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<Matrix />);
