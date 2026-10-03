// An expense card written the "web way" in React Native, shown in the browser preview (react-native-web).
// It has three problems on purpose: bare text in a View, an Image without a size and a field nobody can type into.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';

function ExpenseCard() {
  const [label, setLabel] = useState('%%groceries%%');
  return (
    <View style={styles.card}>
      <Image source={{ uri: 'https://example.com/receipt.png' }} style={styles.receipt} />
      <Text style={styles.title}>{label}</Text>
      <View>%%amount%%</View>
      <TextInput value={label} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 8, borderWidth: 1, borderColor: '#767676', borderRadius: 8 },
  // backgroundColor makes the Image's box visible: pictures do not load in this preview.
  receipt: { backgroundColor: '#d4d4d4' },
  title: { fontSize: 20, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#767676', borderRadius: 6, padding: 8 },
});

createRoot(document.getElementById('root')).render(<ExpenseCard />);
