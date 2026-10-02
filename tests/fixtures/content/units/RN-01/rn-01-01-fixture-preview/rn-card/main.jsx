// A React Native card in the browser preview (react-native-web): a heading and a counter button.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function Card() {
  const [likes, setLikes] = useState(0);
  return (
    <View style={styles.card}>
      <Text role="heading" style={styles.title}>%%title%%</Text>
      <Pressable role="button" style={styles.button} onPress={() => setLikes(likes + 1)}>
        <Text style={styles.label}>%%like%%: {likes}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 12, borderWidth: 1, borderColor: '#767676', borderRadius: 8 },
  title: { fontSize: 20, fontWeight: '600' },
  button: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#1d4ed8', borderRadius: 6, alignSelf: 'flex-start' },
  label: { color: '#ffffff' },
});

createRoot(document.getElementById('root')).render(<Card />);
