import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatLabel } from './domain/format.js';

// The older accessibilityRole props and a StyleSheet: also a valid native card.
export function TaskCard({ task, labels, onToggle }) {
  const label = formatLabel(task, labels);
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{label}</Text>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => onToggle()}>
        <Text style={styles.buttonText}>{labels.toggle}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 8 },
  title: { fontSize: 18, fontWeight: '600' },
  button: { alignSelf: 'flex-start', padding: 8, backgroundColor: '#1d4ed8' },
  buttonText: { color: '#ffffff' },
});
