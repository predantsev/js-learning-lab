// Preview plumbing (read-only): shows what shipping `second` to people who have `first` would do.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { first, second } from './releases.js';
import { shipOutcome } from './simulated-store.js';

const outcomeText = {
  update: '%%update%%',
  'same-build': '%%sameBuild%%',
  'lower-build': '%%lowerBuild%%',
  'separate-app': '%%separateApp%%',
  incomplete: '%%incomplete%%',
};

function PlatformRow({ platform, label }) {
  const outcome = shipOutcome(platform, first, second);
  return (
    <View style={styles.row}>
      <Text style={styles.platform}>{label}</Text>
      <Text>{outcomeText[outcome]}</Text>
    </View>
  );
}

function ReleasePlan() {
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>%%title%%</Text>
      <Text>{String(first.version)} → {String(second.version)}</Text>
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
});

createRoot(document.getElementById('root')).render(<ReleasePlan />);
