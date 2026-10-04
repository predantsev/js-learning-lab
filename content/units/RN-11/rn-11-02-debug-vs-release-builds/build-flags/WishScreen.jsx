import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { simulatedFetch } from './simulated-network.js';

const DEV_MACHINE = 'http://10.0.2.2:7310'; // the computer, as the emulator sees it

export function WishScreen({ labels }) {
  const [wishes, setWishes] = useState([]);

  useEffect(() => {
    simulatedFetch(`${DEV_MACHINE}/records/wishlist`)
      .then((response) => response.json())
      .then(setWishes)
      .catch((error) => console.log('load failed:', error.name, error.message));
  }, []);

  console.log(`render: ${wishes.length} wishes`); // unguarded: runs in every build
  if (__DEV__) console.log('[dev] source:', DEV_MACHINE);

  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>{labels.title}</Text>
      {__DEV__ && <Text style={styles.badge}>DEV</Text>}
      {wishes.map((wish) => <Text key={wish.id}>{wish.name}</Text>)}
      <Text style={styles.count}>{labels.count}: {wishes.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 6 },
  title: { fontSize: 20, fontWeight: '600' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 6, backgroundColor: '#7a2e00', color: '#ffffff' },
  count: { color: '#3d3d3d' },
});
