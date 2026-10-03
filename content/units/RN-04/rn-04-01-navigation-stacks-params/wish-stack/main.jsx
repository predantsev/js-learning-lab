// A wishlist on a SIMULATED native stack in the browser preview (see navSim.jsx).
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SimStack, createStack } from './navSim.jsx';
import { createRecordStore } from './recordStore.js';

const wishes = createRecordStore([
  { id: 'w-01', name: '%%headphones%%', price: 80 },
  { id: 'w-03', name: '%%bicycle%%', price: 240 },
]);

function ListScreen({ navigation }) {
  const all = wishes.useRecords();
  return all.map((wish) => (
    // The detail screen receives the whole wish object as its param.
    <Pressable key={wish.id} accessibilityRole="button" style={styles.row} onPress={() => navigation.push('Detail', { wish })}>
      <Text>
        {wish.name} · {wish.price} ₴
      </Text>
    </Pressable>
  ));
}

function DetailScreen({ navigation, route }) {
  const { wish } = route.params;
  return (
    <View style={styles.column}>
      <Text testID="detail-name" style={styles.name}>
        {wish.name}
      </Text>
      <Pressable accessibilityRole="button" style={styles.row} onPress={() => navigation.push('Edit', { id: wish.id })}>
        <Text>%%edit%%</Text>
      </Pressable>
    </View>
  );
}

function EditScreen({ navigation, route }) {
  const wish = wishes.useRecords().find((item) => item.id === route.params.id);
  const [name, setName] = useState(wish.name);
  return (
    <View style={styles.column}>
      <TextInput accessibilityLabel="%%nameLabel%%" value={name} onChangeText={setName} style={styles.input} />
      <Pressable
        accessibilityRole="button"
        style={styles.row}
        onPress={() => {
          wishes.update(wish.id, { name });
          navigation.goBack();
        }}
      >
        <Text>%%save%%</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 8 },
  row: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  name: { fontSize: 20, fontWeight: '600' },
  input: { minHeight: 44, paddingHorizontal: 10, borderWidth: 1, borderColor: '#767676', borderRadius: 6 },
});

const stack = createStack('List');
createRoot(document.getElementById('root')).render(
  <SimStack stack={stack} screens={{ List: ListScreen, Detail: DetailScreen, Edit: EditScreen }} />,
);
