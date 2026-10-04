// Preview plumbing (read-only): one release run on the simulated target.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { releaseRun } from './simulated-release.js';

globalThis.__DEV__ = true; // the preview itself runs like a debug build; the launch stage switches it off

function ReleaseRun() {
  const stages = releaseRun();
  for (const stage of stages) console.log(stage.text);
  const last = stages[stages.length - 1];
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>%%title%%</Text>
      {stages.map((stage) => (
        <Text key={stage.text} style={stage.ok ? styles.ok : styles.failed}>{stage.text}</Text>
      ))}
      {last.wishes && last.ok && last.wishes.map((wish) => <Text key={wish.id}>{wish.name}</Text>)}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 6 },
  title: { fontSize: 20, fontWeight: '600' },
  ok: { fontFamily: 'monospace', color: '#1d5e20' },
  failed: { fontFamily: 'monospace', color: '#8a1c1c' },
});

createRoot(document.getElementById('root')).render(<ReleaseRun />);
