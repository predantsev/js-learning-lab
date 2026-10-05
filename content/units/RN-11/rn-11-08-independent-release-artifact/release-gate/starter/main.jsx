// Preview plumbing (read-only): the gate's verdict for both candidates.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { candidateA, candidateB, installed } from './candidates.js';
import { deliveryPath, releaseCheck } from './release-gate.js';

function Verdict({ name, candidate }) {
  const result = releaseCheck(installed, candidate);
  console.log(`${name}:`, JSON.stringify(result));
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name} · versionCode {candidate.versionCode}</Text>
      <Text>{result.problems.length === 0 ? '%%noProblems%%' : result.problems.join(', ')}</Text>
      <Text>%%leftBehind%%: {result.leftBehindApis.join(', ') || '—'}</Text>
    </View>
  );
}

function Gate() {
  const textOnly = deliveryPath([{ kind: 'js' }, { kind: 'asset' }]);
  console.log('text and image change:', textOnly);
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>%%title%%</Text>
      <Verdict name="A" candidate={candidateA} />
      <Verdict name="B" candidate={candidateB} />
      <Text>%%delivery%%: {textOnly}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: '600' },
  card: { borderWidth: 1, borderColor: '#5c5c5c', borderRadius: 6, padding: 10, gap: 2 },
  name: { fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<Gate />);
