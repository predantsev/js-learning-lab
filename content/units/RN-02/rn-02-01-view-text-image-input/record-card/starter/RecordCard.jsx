import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatPrice } from './format.js';

// Pictures do not load in the preview; the grey box shows the size the Image gets.
const PICTURE = { uri: 'https://example.com/wish-placeholder.png' };

export function RecordCard({ item }) {
  const [name, setName] = useState(item.name);
  return (
    <View testID="card" style={styles.card}>
      {/* 1. A picture: Image with source={PICTURE}, testID="picture" and a size from styles.picture. */}
      {/* 2. The wish's name (from state) and its price through formatPrice. */}
      {/* 3. A field that edits the name. */}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, gap: 6, borderWidth: 1, borderColor: '#767676', borderRadius: 8 },
  picture: { backgroundColor: '#d4d4d4' },
  name: { fontSize: 18, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#767676', borderRadius: 6, padding: 8 },
});
