// Preview plumbing: the wish list on a simulated device store, plus a simulated
// connectivity switch below the phone frame. There is no server in this app at all.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createSimulatedStore } from './native-store.js';
import { WishRow } from './WishRow.jsx';

const KEY = 'jsll.wishlist.v1';
const initialWishes = [
  { id: 'w-02', name: '%%lamp%%', price: 45, acquired: false, category: null },
  { id: 'w-06', name: '%%mug%%', price: 18, acquired: true, category: null },
];
// The wishes were saved on this device earlier.
const store = createSimulatedStore({ entries: { [KEY]: JSON.stringify({ schemaVersion: 1, records: initialWishes }) } });
const labels = {
  saving: '%%saving%%',
  notSaved: '%%notSaved%%',
  synced: '%%synced%%',
  offline: '%%offline%%',
  savedOnDevice: '%%savedOnDevice%%',
  acquired: '%%acquired%%',
  wanted: '%%wanted%%',
};

function App() {
  const [online, setOnline] = useState(true);
  const [wishes, setWishes] = useState(initialWishes);
  const [save, setSave] = useState({ 'w-02': 'saved', 'w-06': 'saved' });

  const toggle = async (id) => {
    const next = wishes.map((wish) => (wish.id === id ? { ...wish, acquired: !wish.acquired } : wish));
    setWishes(next);
    setSave({ ...save, [id]: 'saving' });
    try {
      await store.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: next }));
      setSave((current) => ({ ...current, [id]: 'saved' }));
    } catch {
      setSave((current) => ({ ...current, [id]: 'failed' }));
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.phone}>
        {wishes.map((wish) => (
          <WishRow key={wish.id} wish={wish} save={save[wish.id]} online={online} labels={labels} onToggle={() => toggle(wish.id)} />
        ))}
      </View>
      <Pressable role="switch" aria-checked={!online} style={styles.toggle} onPress={() => setOnline(!online)}>
        <Text>{online ? '%%goOffline%%' : '%%goOnline%%'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 8, gap: 12 },
  phone: { borderWidth: 2, borderColor: '#3d3d3d', borderRadius: 16, padding: 12 },
  toggle: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#e5e7eb', borderRadius: 6 },
});

createRoot(document.getElementById('root')).render(<App />);
