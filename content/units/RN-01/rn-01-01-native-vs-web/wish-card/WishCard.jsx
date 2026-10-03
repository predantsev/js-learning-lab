import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatWish } from './domain/format.js';

export function WishCard({ wish, labels }) {
  const [acquired, setAcquired] = useState(wish.acquired);
  return (
    <View style={styles.card}>
      <Text role="heading" style={styles.title}>{formatWish(wish, labels)}</Text>
      <Text style={styles.status}>{acquired ? labels.acquired : labels.wanted}</Text>
      <Pressable role="button" style={styles.button} onPress={() => setAcquired(!acquired)}>
        <Text style={styles.buttonText}>{labels.toggle}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 8, borderWidth: 1, borderColor: '#767676', borderRadius: 8 },
  title: { fontSize: 20, fontWeight: '600' },
  status: { color: '#3d3d3d' },
  button: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#1d4ed8', borderRadius: 6 },
  buttonText: { color: '#ffffff' },
});
