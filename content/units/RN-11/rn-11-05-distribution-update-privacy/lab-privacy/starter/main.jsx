// Preview plumbing (read-only): the declaration as a store form would summarise it.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { declaration } from './declaration.js';

function DeclarationScreen() {
  const collected = declaration.filter((line) => line.collected);
  const notCollected = declaration.filter((line) => !line.collected);
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>%%collected%%</Text>
      {collected.map((line) => <Text key={line.field}>{line.field} — {line.purpose} ({line.where})</Text>)}
      <Text role="heading" style={styles.title}>%%notCollected%%</Text>
      {notCollected.map((line) => <Text key={line.field}>{line.field} ({line.where})</Text>)}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 4 },
  title: { fontSize: 17, fontWeight: '600', marginTop: 8 },
});

createRoot(document.getElementById('root')).render(<DeclarationScreen />);
