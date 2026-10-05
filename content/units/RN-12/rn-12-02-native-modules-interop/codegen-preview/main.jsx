// main.jsx: reads the spec file as text, runs the simulated codegen on it and checks the call sites.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { callSites, fits } from './callSites.js';
import { generate } from './miniCodegen.js';

function CodegenPreview() {
  const [result, setResult] = useState(null);
  useEffect(() => {
    fetch('./specs/NativeExpenseStore.ts')
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
      {result.methods.map((m) => (
        <View key={m.name} style={styles.card}>
          <Text style={styles.name}>
            {m.name} · {m.sync ? '%%sync%%' : '%%async%%'}
          </Text>
          <Text style={styles.code}>Java: {m.java}</Text>
          <Text style={styles.code}>Objective-C: {m.objc}</Text>
        </View>
      ))}
      <Text role="heading" style={styles.heading}>%%callSitesHeading%%</Text>
      {callSites.map((site) => {
        const spec = result.methods.find((m) => m.name === site.method);
        const broken = !spec
          ? '%%noMethod%%'
          : site.args.length !== spec.params.length
            ? '%%wrongCount%%'
            : spec.params
                .map((param, index) => (fits(site.args[index], param.type) ? null : `${param.name}: %%expected%% ${param.type}, %%got%% ${JSON.stringify(site.args[index])}`))
                .filter(Boolean)
                .join('; ');
        return (
          <Text key={site.file} style={broken ? styles.error : null}>
            {site.file} → {site.method}: {broken || '%%fits%%'}
          </Text>
        );
      })}
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

createRoot(document.getElementById('root')).render(<CodegenPreview />);
