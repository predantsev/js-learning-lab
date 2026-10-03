// StorageLab.jsx: saves three values, reads the token back and shows what lies on the "device".
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { deviceLogLine, inspect, ordinaryStorage, secureStorage } from './deviceSim.js';

const TOKEN = 'tok_demo_7f3a9c'; // synthetic: what the lab's mock sign-in returns

const tasks = [
  { id: 't-01', title: '%%water%%', dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: '%%library%%', dueDate: '2026-03-01', done: false, priority: 'high' },
];

// Which store keeps the session token: change only this line.
const tokenStore = { save: (token) => ordinaryStorage.setItem('session.token', token), read: () => ordinaryStorage.getItem('session.token') };
// const tokenStore = { save: (token) => secureStorage.setSecret('session.token', token), read: () => secureStorage.getSecret('session.token') };

async function runLab() {
  await tokenStore.save(TOKEN);
  await ordinaryStorage.setItem('settings.theme', 'dark');
  await ordinaryStorage.setItem('jsll.planner.v1', JSON.stringify({ schemaVersion: 1, records: tasks }));

  // Later, for example after a restart: read the token back to restore the session.
  const token = await tokenStore.read();
  // deviceLogLine('debug: restored session with', token);
  return token !== null;
}

export function StorageLab() {
  const [state, setState] = useState(null);

  useEffect(() => {
    runLab().then((signedIn) => setState({ signedIn, device: inspect() }));
  }, []);

  if (state === null) return <Text>…</Text>;
  const { signedIn, device } = state;
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text accessibilityRole="header" style={styles.heading}>
        %%session%%: {signedIn ? '%%yes%%' : '%%no%%'}
      </Text>

      <Text accessibilityRole="header" style={styles.section}>%%filesTitle%%</Text>
      {device.files.map(({ key, value }) => (
        <Text key={key} style={styles.row}>
          <Text style={styles.key}>{key}</Text> = {value}
        </Text>
      ))}

      <Text accessibilityRole="header" style={styles.section}>%%keychainTitle%%</Text>
      {device.keychainKeys.length === 0 && <Text style={styles.row}>%%empty%%</Text>}
      {device.keychainKeys.map((key) => (
        <Text key={key} style={styles.row}>
          <Text style={styles.key}>{key}</Text> = %%hidden%%
        </Text>
      ))}

      <Text accessibilityRole="header" style={styles.section}>%%logTitle%%</Text>
      {device.log.length === 0 && <Text style={styles.row}>%%empty%%</Text>}
      {device.log.map((line, index) => (
        <Text key={index} style={styles.row}>{line}</Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 12, gap: 6 },
  heading: { fontSize: 18, fontWeight: '700' },
  section: { fontSize: 15, fontWeight: '700', marginTop: 10 },
  row: { fontFamily: 'monospace', fontSize: 13, color: '#1f2937' },
  key: { fontWeight: '700' },
});
