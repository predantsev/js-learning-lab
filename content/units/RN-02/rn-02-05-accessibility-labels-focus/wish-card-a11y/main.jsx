// A wish card with an icon-only delete button and a price field, in the browser preview (react-native-web).
// After rendering, inspect.js prints the role and label of each element the preview exposes.
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { printAccessibility } from './inspect.js';

function WishCard() {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>%%headphones%%</Text>
        <Text>80 ₴</Text>
        <Text>%%wanted%%</Text>
      </View>
      <Pressable style={styles.delete} onPress={() => {}}>
        <Text style={styles.icon}>✕</Text>
      </Pressable>
      <Text>%%price%%</Text>
      <TextInput style={styles.input} defaultValue="80" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, gap: 6, borderWidth: 1, borderColor: '#767676', borderRadius: 8 },
  info: { gap: 2 },
  name: { fontSize: 18, fontWeight: '600' },
  delete: { position: 'absolute', top: 0, right: 0, padding: 12 },
  icon: { width: 24, height: 24, fontSize: 18, lineHeight: 24, textAlign: 'center', color: '#b91c1c' },
  input: { borderWidth: 1, borderColor: '#767676', borderRadius: 6, padding: 8 },
});

const root = document.getElementById('root');
createRoot(root).render(<WishCard />);
setTimeout(() => printAccessibility(root), 200);
