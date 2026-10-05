// Preview plumbing: the release check screen.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { installed, next } from './releases.js';
import { shipOutcome } from './simulated-store.js';

const outcomeText = {
  update: '%%update%%',
  'same-build': '%%sameBuild%%',
  'lower-build': '%%lowerBuild%%',
  'separate-app': '%%separateApp%%',
  incomplete: '%%incomplete%%',
};

function PlatformRow({ platform, label }) {
  const outcome = shipOutcome(platform, installed, next);
  console.log(`${platform}: ${outcome}`);
  return (
    <View style={styles.row}>
      <Text style={styles.platform}>{label}</Text>
      <Text style={styles.outcome}>{outcomeText[outcome]}</Text>
    </View>
  );
}

function ReleaseCheck() {
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>%%title%%</Text>
      <Text>{installed.version} → {next.version}</Text>
      <PlatformRow platform="android" label="Android" />
      <PlatformRow platform="ios" label="iOS" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: '600' },
  row: { borderWidth: 1, borderColor: '#5c5c5c', borderRadius: 6, padding: 10, gap: 2 },
  platform: { fontWeight: '600' },
  outcome: { color: '#1f1f1f' },
});

createRoot(document.getElementById('root')).render(<ReleaseCheck />);
