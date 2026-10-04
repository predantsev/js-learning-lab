// Preview plumbing: what Git would track, and what a secret scanner finds among it.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { gitignore, home, repo } from './project.js';
import { scanForSecrets, trackedFiles } from './simulated-git.js';

const kindText = { 'key-file': '%%keyFile%%', password: '%%password%%' };

function RepoScreen() {
  const tracked = trackedFiles(repo, gitignore);
  const findings = scanForSecrets(repo, gitignore);
  console.log(`tracked: ${tracked.length}, findings: ${findings.length}`);
  for (const finding of findings) console.log(`finding: ${finding.path} (${finding.kind})`);
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>%%tracked%%</Text>
      {tracked.map((path) => <Text key={path} style={styles.mono}>{path}</Text>)}
      <Text role="heading" style={styles.title}>%%scan%%: {findings.length}</Text>
      {findings.map((finding) => (
        <Text key={finding.path} style={styles.finding}>{finding.path} — {kindText[finding.kind]}</Text>
      ))}
      <Text role="heading" style={styles.title}>%%outside%%</Text>
      {Object.keys(home).map((path) => <Text key={path} style={styles.mono}>{path}</Text>)}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 4 },
  title: { fontSize: 17, fontWeight: '600', marginTop: 8 },
  mono: { fontFamily: 'monospace' },
  finding: { fontFamily: 'monospace', color: '#8a1c1c' },
});

createRoot(document.getElementById('root')).render(<RepoScreen />);
