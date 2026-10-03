// One wish card whose shadow differs per platform, in the browser preview (react-native-web).
// selectFor(SIMULATED_OS, …) stands in for Platform.select(…), so you can try each platform's branch.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { SIMULATED_OS, selectFor } from './platformSim.js';

const shadow = selectFor(SIMULATED_OS, {
  ios: { shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  android: { elevation: 4 },
  default: { borderWidth: 1, borderColor: '#767676' },
});

function WishCard() {
  return (
    <View style={[styles.card, shadow]}>
      <Text style={styles.name}>%%bicycle%%</Text>
      <Text>240 ₴</Text>
      <Text style={styles.debug}>{`OS: ${SIMULATED_OS} → ${JSON.stringify(shadow)}`}</Text>
    </View>
  );
}

// The layout is shared by every platform: only the shadow differs.
const styles = StyleSheet.create({
  card: { margin: 16, padding: 16, gap: 6, borderRadius: 12, backgroundColor: '#ffffff' },
  name: { fontSize: 18, fontWeight: '600' },
  debug: { fontSize: 12, color: '#4b4b4b' },
});

createRoot(document.getElementById('root')).render(<WishCard />);
