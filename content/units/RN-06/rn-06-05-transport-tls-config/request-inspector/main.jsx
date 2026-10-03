// A request inspector: would the platform let this request out? In the browser preview (react-native-web).
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { androidAllows, iosAllows } from './policy.js';

// The addresses each platform uses for the mock service, and the build. Try 'release' and https.
const ANDROID_URL = 'http://10.0.2.2:7310/records/wishlist';
const IOS_URL = 'http://localhost:7310/records/wishlist';
const BUILD = 'debug';

function Row({ platform, url, allowed }) {
  return (
    <View style={styles.row}>
      <Text style={styles.platform}>{platform}</Text>
      <Text style={styles.url}>{url}</Text>
      <Text style={allowed ? styles.ok : styles.blocked}>{allowed ? '%%allowed%%' : '%%blocked%%'}</Text>
    </View>
  );
}

function Inspector() {
  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>{`%%build%%: ${BUILD}`}</Text>
      <Row platform="Android" url={ANDROID_URL} allowed={androidAllows(ANDROID_URL, BUILD)} />
      <Row platform="iOS" url={IOS_URL} allowed={iosAllows(IOS_URL)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 10 },
  heading: { fontSize: 18, fontWeight: '600' },
  row: { padding: 10, gap: 2, borderWidth: 1, borderColor: '#767676', borderRadius: 6 },
  platform: { fontWeight: '600' },
  url: { fontFamily: 'monospace', fontSize: 13 },
  ok: { color: '#166534' },
  blocked: { color: '#b91c1c', fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<Inspector />);
