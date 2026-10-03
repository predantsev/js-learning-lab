// A wishlist that opens a wish from a synthetic link, with a SIMULATED stack and Linking
// (see navSim.jsx and linkingSim.jsx).
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Linking, LinkControls } from './linkingSim.jsx';
import { SimStack, createStack } from './navSim.jsx';

const wishes = [
  { id: 'w-01', name: '%%headphones%%' },
  { id: 'w-03', name: '%%bicycle%%' },
];

function ListScreen({ navigation }) {
  return wishes.map((wish) => (
    <Pressable key={wish.id} accessibilityRole="button" style={styles.row} onPress={() => navigation.push('Detail', { id: wish.id })}>
      <Text>{wish.name}</Text>
    </Pressable>
  ));
}

function DetailScreen({ route }) {
  const wish = wishes.find((item) => item.id === route.params.id);
  return <Text style={styles.name}>{wish ? wish.name : '%%notFound%%'}</Text>;
}

function App() {
  const [stack] = useState(() => createStack('List'));

  useEffect(() => {
    // Takes the last part of the link as the id and opens it.
    function openLink(url) {
      const id = decodeURIComponent(url.split('/').pop());
      stack.navigate('Detail', { id });
    }
    const subscription = Linking.addEventListener('url', ({ url }) => openLink(url));
    return () => subscription.remove();
  }, [stack]);

  return <SimStack stack={stack} screens={{ List: ListScreen, Detail: DetailScreen }} />;
}

// Restarting the app from scratch: a new App with a new stack.
function Device() {
  const [boot, setBoot] = useState(1);
  return (
    <>
      <App key={boot} />
      <LinkControls
        links={[
          { label: '%%linkValid%%', url: 'courselab://wish/w-03' },
          { label: '%%linkUnknown%%', url: 'courselab://wish/w-99' },
          { label: '%%linkMalformed%%', url: 'courselab://wish/%E0%A4%A' },
        ]}
        onColdStart={() => setBoot(boot + 1)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  name: { fontSize: 20, fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<Device />);
