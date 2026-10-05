import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatPrice } from './format.js';

// Pictures do not load in the preview; the grey box shows the size the Image gets.
const PICTURE = { uri: 'https://example.com/wish-placeholder.png' };

// Misconception: a network Image sizes itself from the file, like <img>.
export function RecordCard({ item }) {
  const [name, setName] = useState(item.name);
  return (
    <View testID="card" style={styles.card}>
      <Image testID="picture" source={PICTURE} style={styles.picture} />
      <Text style={styles.name}>{name}</Text>
      <Text>{formatPrice(item.price)}</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, gap: 6, borderWidth: 1, borderColor: '#767676', borderRadius: 8 },
  picture: { backgroundColor: '#d4d4d4' },
  name: { fontSize: 18, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#767676', borderRadius: 6, padding: 8 },
});
