import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatPrice } from './format.js';

// Pictures do not load in the preview; the grey box shows the size the Image gets.
const PICTURE = { uri: 'https://example.com/wish-placeholder.png' };

// Another valid approach: one Text with a nested Text, and onChange reading nativeEvent.text.
export function RecordCard({ item }) {
  const [name, setName] = useState(item.name);
  return (
    <View testID="card" style={styles.card}>
      <Image testID="picture" source={PICTURE} style={[styles.picture, { width: 48, height: 48 }]} />
      <Text>
        <Text style={styles.name}>{name}</Text> · {formatPrice(item.price)}
      </Text>
      <TextInput value={name} onChange={(event) => setName(event.nativeEvent.text)} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, gap: 6, borderWidth: 1, borderColor: '#767676', borderRadius: 8 },
  picture: { backgroundColor: '#d4d4d4' },
  name: { fontSize: 18, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#767676', borderRadius: 6, padding: 8 },
});
