// WishCard.jsx: a ready record card. Do not edit.
// The note is the card's own state, so it shows which wish a mounted row belongs to.
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

export function WishCard({ wish }) {
  const [note, setNote] = useState('');
  return (
    <View testID="wish-card" style={styles.card}>
      <Text style={styles.name}>{wish.name}</Text>
      <Text>{wish.acquired ? '%%acquired%%' : '%%wanted%%'}</Text>
      <TextInput
        accessibilityLabel={`%%note%%: ${wish.name}`}
        placeholder="%%note%%"
        style={styles.input}
        value={note}
        onChangeText={setNote}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, gap: 4 },
  name: { fontSize: 16, fontWeight: '600' },
  input: { minHeight: 44, borderWidth: 1, borderColor: '#4b5563', borderRadius: 6, paddingHorizontal: 8 },
});
