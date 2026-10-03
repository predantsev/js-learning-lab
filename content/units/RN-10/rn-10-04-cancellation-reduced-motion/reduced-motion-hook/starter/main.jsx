// A wishlist row that shows how it will animate, following your useReducedMotion hook. Do not edit.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { activeSubscriptions, setReduceMotion } from './motionSettings.js';
import { useReducedMotion } from './useReducedMotion.js';

function WishRow() {
  const reduced = useReducedMotion();
  return (
    <View style={styles.row}>
      <Text style={styles.name}>%%headphones%%</Text>
      <Text>{reduced ? '%%fade%%' : '%%slide%%'}</Text>
    </View>
  );
}

function App() {
  const [osSetting, setOsSetting] = useState(false);
  const [shown, setShown] = useState(true);
  const [, refresh] = useState(0);
  return (
    <View style={styles.screen}>
      {shown && <WishRow />}
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: osSetting }} style={styles.button} onPress={() => {
        setReduceMotion(!osSetting);
        setOsSetting(!osSetting);
      }}>
        <Text style={styles.buttonText}>%%osSetting%%: {osSetting ? '%%on%%' : '%%off%%'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => setShown(!shown)}>
        <Text style={styles.buttonText}>{shown ? '%%hide%%' : '%%show%%'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => refresh((n) => n + 1)}>
        <Text style={styles.buttonText}>%%count%%: {activeSubscriptions()}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 12, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 12, borderWidth: 1, borderColor: '#4b5563', borderRadius: 6 },
  name: { flex: 1, fontSize: 16 },
  button: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#1d4ed8', borderRadius: 6 },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<App />);
