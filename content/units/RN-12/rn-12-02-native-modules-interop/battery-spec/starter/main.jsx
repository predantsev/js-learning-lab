// main.jsx (read-only): runs the simulated codegen on your spec and shows your ownership table.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { generate } from './miniCodegen.js';
import { ownership } from './ownership.js';

function SpecPreview() {
  const [result, setResult] = useState(null);
  useEffect(() => {
    fetch('./specs/NativeBatteryLevel.ts')
      .then((response) => response.text())
      .then((text) => setResult(generate(text)));
  }, []);
  if (!result) return <Text>…</Text>;

  return (
    <View style={styles.page}>
      <Text role="heading" style={styles.heading}>{result.moduleName ?? '?'}</Text>
      {result.errors.map((error) => (
        <Text key={error} style={styles.error}>%%errorLabel%%: {error}</Text>
      ))}
      {result.methods.length === 0 ? <Text>%%noMethods%%</Text> : null}
      {result.methods.map((m) => (
        <View key={m.name} style={styles.card}>
          <Text style={styles.name}>
            {m.name} · {m.sync ? '%%sync%%' : '%%async%%'}
          </Text>
          <Text style={styles.code}>Java: {m.java}</Text>
          <Text style={styles.code}>Objective-C: {m.objc}</Text>
        </View>
      ))}
      <Text role="heading" style={styles.heading}>%%ownershipHeading%%</Text>
      {Object.entries(ownership ?? {}).map(([part, who]) => (
        <Text key={part}>
          {part}: {who || '—'}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 12, gap: 8, maxWidth: 480 },
  heading: { fontSize: 17, fontWeight: '600' },
  card: { padding: 8, gap: 2, borderWidth: 1, borderColor: '#bdbdbd', borderRadius: 6 },
  name: { fontWeight: '600' },
  code: { fontFamily: 'monospace', fontSize: 13 },
  error: { color: '#a11d1d', fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<SpecPreview />);
