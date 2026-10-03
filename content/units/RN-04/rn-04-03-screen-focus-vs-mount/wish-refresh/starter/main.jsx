// Read-only: the wishlist on a SIMULATED stack (see navSim.jsx). The detail screen writes through storage.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, Text, View } from 'react-native';
import { SimStack, createStack } from './navSim.jsx';
import { storage } from './storage.js';
import { WishListScreen } from './WishList.jsx';

function DetailScreen({ route }) {
  const [message, setMessage] = useState('');
  async function markAcquired() {
    const wishes = await storage.readAll();
    await storage.writeAll(wishes.map((wish) => (wish.id === route.params.id ? { ...wish, acquired: true } : wish)));
    setMessage('%%savedAcquired%%');
  }
  return (
    <View style={{ gap: 8 }}>
      <Pressable accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }} onPress={markAcquired}>
        <Text>%%markAcquired%%</Text>
      </Pressable>
      <Text testID="detail-message">{message}</Text>
    </View>
  );
}

export const stack = createStack('List');

createRoot(document.getElementById('root')).render(
  <SimStack stack={stack} screens={{ List: WishListScreen, Detail: DetailScreen }} />,
);
