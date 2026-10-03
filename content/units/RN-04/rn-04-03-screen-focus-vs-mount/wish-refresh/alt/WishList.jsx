import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from './navSim.jsx';
import { storage } from './storage.js';

export function WishListScreen({ navigation }) {
  const [wishes, setWishes] = useState([]);

  // The same with the stack's 'focus' and 'blur' events: each read gets a number, and only the
  // latest read of the current focus may update the list.
  useEffect(() => {
    let current = 0;
    const offFocus = navigation.addListener('focus', () => {
      const ticket = ++current;
      storage.readAll().then((next) => {
        if (ticket === current) setWishes(next);
      });
    });
    const offBlur = navigation.addListener('blur', () => {
      current += 1;
    });
    return () => {
      offFocus();
      offBlur();
      current += 1;
    };
  }, [navigation]);

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
