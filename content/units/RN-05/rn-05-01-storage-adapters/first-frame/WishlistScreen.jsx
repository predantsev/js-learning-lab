import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useWishes } from './useWishes.js';

export function WishlistScreen({ storage, labels }) {
  const { status, records } = useWishes(storage);

  // Runs after every commit: prints what this frame shows.
  useEffect(() => {
    console.log(`${labels.frame}: ${status === 'loading' ? labels.loading : `${records.length} ${labels.wishes}`}`);
  });

  if (status === 'loading') {
    return (
      <View style={styles.screen}>
        <ActivityIndicator />
        <Text>{labels.loading}</Text>
      </View>
    );
  }
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>{labels.title}</Text>
      {records.length === 0 ? <Text>{labels.empty}</Text> : null}
      {records.map((wish) => (
        <Text key={wish.id} style={styles.row}>{wish.name}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: '600' },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
});
