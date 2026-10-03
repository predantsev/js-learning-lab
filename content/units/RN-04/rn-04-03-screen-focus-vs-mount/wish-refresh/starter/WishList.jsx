import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from './navSim.jsx';
import { storage } from './storage.js';

export function WishListScreen({ navigation }) {
  const [wishes, setWishes] = useState([]);

  // Reads the wishes once, when the screen mounts.
  useEffect(() => {
    storage.readAll().then(setWishes);
  }, []);

  return wishes.map((wish) => (
    <Pressable key={wish.id} accessibilityRole="button" style={styles.row} onPress={() => navigation.push('Detail', { id: wish.id })}>
      <Text testID={`wish-${wish.id}`}>
        {wish.acquired ? '✓ ' : ''}
        {wish.name}
      </Text>
    </Pressable>
  ));
}

const styles = StyleSheet.create({
  row: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
});
