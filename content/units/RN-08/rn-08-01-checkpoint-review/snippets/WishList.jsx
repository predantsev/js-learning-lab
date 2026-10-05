// Question 1: a wishlist screen that saves after every change.
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

const KEY = 'jsll.wishlist.v1';

export function WishList({ storage, labels }) {
  const [wishes, setWishes] = useState(null);

  // Restore on launch.
  useEffect(() => {
    storage.getItem(KEY).then((text) => setWishes(JSON.parse(text).records));
  }, [storage]);

  function markAcquired(id) {
    setWishes(wishes.map((wish) => (wish.id === id ? { ...wish, acquired: true } : wish)));
    console.log('wishes: acquired before saving =', wishes.filter((wish) => wish.acquired).length);
    storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: wishes }));
  }

  if (wishes === null) return <Text>{labels.loading}</Text>;
  return wishes.map((wish) => (
    <Pressable key={wish.id} accessibilityRole="button" style={styles.row} onPress={() => markAcquired(wish.id)}>
      <Text>
        {wish.acquired ? '✓ ' : ''}
        {wish.name}
      </Text>
    </Pressable>
  ));
}

const styles = StyleSheet.create({
  row: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
});
