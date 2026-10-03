// Shows the wish list in the browser preview, with a button that adds a wish at the top. Do not edit.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, Text, View } from 'react-native';
import { WishList } from './WishList.jsx';

const fixtures = [
  { id: 'w-01', name: '%%headphones%%', price: 80, acquired: false, category: null },
  { id: 'w-02', name: '%%lamp%%', price: 45, acquired: false, category: null },
  { id: 'w-03', name: '%%bicycle%%', price: 240, acquired: false, category: null },
  { id: 'w-04', name: '%%book%%', price: 25, acquired: true, category: null },
  { id: 'w-05', name: '%%tickets%%', price: null, acquired: false, category: null },
  { id: 'w-06', name: '%%mug%%', price: 18, acquired: true, category: null },
];

function Demo() {
  const [wishes, setWishes] = useState(fixtures);
  return (
    <View style={{ flex: 1 }}>
      <Pressable
        accessibilityRole="button"
        style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 12 }}
        onPress={() => setWishes([{ id: `w-new-${wishes.length}`, name: '%%plant%%', price: null, acquired: false, category: null }, ...wishes])}
      >
        <Text>%%addTop%%</Text>
      </Pressable>
      <WishList wishes={wishes} />
    </View>
  );
}

createRoot(document.getElementById('root')).render(<Demo />);
