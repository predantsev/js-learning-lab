// Preview plumbing: your build next to the supplied artifact of the other platform.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { myBuild } from './my-build.js';
import { readAndroid, readIos } from './simulated-reader.js';

const other = myBuild.platform === 'android' ? readIos() : readAndroid();

function Row({ label, mine, theirs }) {
  const same = mine === theirs;
  console.log(`${label}: ${mine} | ${theirs} → ${same ? 'same' : 'different'}`);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text>{myBuild.platform}: {mine}</Text>
      <Text>{other.platform}: {theirs}</Text>
      <Text style={same ? styles.same : styles.different}>{same ? '%%same%%' : '%%different%%'}</Text>
    </View>
  );
}

function Viewer() {
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>%%title%%</Text>
      <Row label="%%idLabel%%" mine={myBuild.id} theirs={other.id} />
      <Row label="%%versionLabel%%" mine={myBuild.version} theirs={other.version} />
      <Row label="%%buildLabel%%" mine={myBuild.build} theirs={other.build} />
      <Text style={styles.label}>%%permissionsLabel%% ({myBuild.platform})</Text>
      {myBuild.permissions.map((name) => <Text key={name} style={styles.mono}>{name}</Text>)}
      <Text style={styles.label}>%%permissionsLabel%% ({other.platform})</Text>
      {other.permissions.length === 0
        ? <Text>%%none%%</Text>
        : other.permissions.map((name) => <Text key={name} style={styles.mono}>{name}</Text>)}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 6 },
  title: { fontSize: 20, fontWeight: '600' },
  row: { borderWidth: 1, borderColor: '#5c5c5c', borderRadius: 6, padding: 8 },
  label: { fontWeight: '600', marginTop: 4 },
  mono: { fontFamily: 'monospace' },
  same: { color: '#1d5e20' },
  different: { color: '#8a1c1c' },
});

createRoot(document.getElementById('root')).render(<Viewer />);
