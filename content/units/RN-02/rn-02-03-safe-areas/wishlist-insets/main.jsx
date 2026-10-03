// A wishlist screen in a SIMULATED phone frame (browser preview, react-native-web).
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DeviceFrame, useSimulatedInsets } from './DeviceFrame.jsx';

const ORIENTATION = 'portrait'; // or 'landscape'

const wishes = ['%%headphones%%', '%%lamp%%', '%%bicycle%%'];

function WishlistScreen() {
  const insets = useSimulatedInsets(); // on a device: useSafeAreaInsets()
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>%%title%%</Text>
      </View>
      <View style={styles.list}>
        {wishes.map((name) => <Text key={name} style={styles.row}>{name}</Text>)}
      </View>
      <View style={styles.bar}>
        <Pressable role="button" style={styles.button}>
          <Text style={styles.buttonText}>%%add%%</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#e8eef7' },
  heading: { fontSize: 20, fontWeight: '600' },
  list: { flex: 1, backgroundColor: '#fff7e6' },
  row: { paddingHorizontal: 16, paddingVertical: 10, fontSize: 16 },
  bar: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#e8eef7' },
  button: { minHeight: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1d4ed8', borderRadius: 8 },
  buttonText: { color: '#ffffff', fontSize: 16 },
});

createRoot(document.getElementById('root')).render(
  <DeviceFrame orientation={ORIENTATION}>
    <WishlistScreen />
  </DeviceFrame>,
);
