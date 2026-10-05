// Preview plumbing (read-only): what Git tracks, what the scanner finds, and whether Gradle can still sign.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { gitignore, home, repo } from './project.js';
import { scanForSecrets, trackedFiles } from './simulated-git.js';
import { releaseSigning } from './simulated-gradle.js';

const kindText = { 'key-file': '%%keyFile%%', password: '%%password%%' };
const problemText = {
  'no-store-file': '%%noStoreFile%%',
  'keystore-not-found': '%%keystoreNotFound%%',
  'missing-password': '%%missingPassword%%',
};

function RepoScreen() {
  const tracked = trackedFiles(repo, gitignore);
  const findings = scanForSecrets(repo, gitignore);
  const signing = releaseSigning(repo, home);
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>%%tracked%%</Text>
      {tracked.map((path) => <Text key={path} style={styles.mono}>{path}</Text>)}
      <Text role="heading" style={styles.title}>%%scan%%: {findings.length}</Text>
      {findings.map((finding) => (
        <Text key={finding.path} style={styles.finding}>{finding.path} — {kindText[finding.kind]}</Text>
      ))}
      <Text role="heading" style={styles.title}>%%signing%%</Text>
      <Text>{signing.ok ? `%%signingOk%% ${signing.storeFile}` : problemText[signing.problem]}</Text>
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
