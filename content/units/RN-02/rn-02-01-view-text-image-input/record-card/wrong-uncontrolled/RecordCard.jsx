import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatPrice } from './format.js';

// Pictures do not load in the preview; the grey box shows the size the Image gets.
const PICTURE = { uri: 'https://example.com/wish-placeholder.png' };

// Mistake: the field starts with the name but never reports changes, so the card's name never updates.
export function RecordCard({ item }) {
  const [name] = useState(item.name);
  return (
    <View testID="card" style={styles.card}>
      <Image testID="picture" source={PICTURE} style={styles.picture} />
      <Text style={styles.name}>{name}</Text>
      <Text>{formatPrice(item.price)}</Text>
      <TextInput defaultValue={name} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, gap: 6, borderWidth: 1, borderColor: '#767676', borderRadius: 8 },
  picture: { width: 64, height: 64, backgroundColor: '#d4d4d4' },
  name: { fontSize: 18, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#767676', borderRadius: 6, padding: 8 },
});
