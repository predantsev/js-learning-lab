// One wish card whose title font differs per platform, in the browser preview (react-native-web).
// selectFor(SIMULATED_OS, …) stands in for Platform.select(…), so you can try each platform's branch.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { SIMULATED_OS, selectFor } from './platformSim.js';

// Font names differ per platform: iOS ships 'Georgia', Android offers the generic 'serif'.
const titleFont = selectFor(SIMULATED_OS, {
  ios: { fontFamily: 'Georgia' },
  android: { fontFamily: 'serif' },
  default: {},
});

function WishCard() {
  return (
    <View style={styles.card}>
      <Text style={[styles.name, titleFont]}>%%bicycle%%</Text>
      <Text>240 ₴</Text>
      <Text style={styles.debug}>{`OS: ${SIMULATED_OS} → ${JSON.stringify(titleFont)}`}</Text>
    </View>
  );
}

// The layout is shared by every platform: only the title font differs.
const styles = StyleSheet.create({
  card: { margin: 16, padding: 16, gap: 6, borderRadius: 12, borderWidth: 1, borderColor: '#767676', backgroundColor: '#ffffff' },
  name: { fontSize: 20, fontWeight: '600' },
  debug: { fontSize: 12, color: '#4b4b4b' },
});

createRoot(document.getElementById('root')).render(<WishCard />);
