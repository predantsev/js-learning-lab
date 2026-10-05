// Shows the wanted wishes with buttons that SIMULATE the end of a swipe and a screen-reader action.
// The preview has no finger and no screen reader. Do not edit.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { acquireActionProps, onSwipeEnd } from './swipeRules.js';

const initialWishes = [
  { id: 'w-01', name: '%%headphones%%', price: 80, acquired: false },
  { id: 'w-02', name: '%%lamp%%', price: 45, acquired: false },
  { id: 'w-03', name: '%%bicycle%%', price: 240, acquired: false },
];

const SWIPES = [
  { id: 'short', label: '%%short%%', event: { translationX: -60, velocityX: -300 } },
  { id: 'long', label: '%%long%%', event: { translationX: -150, velocityX: -200 } },
  { id: 'flick', label: '%%flick%%', event: { translationX: -40, velocityX: -1200 } },
  { id: 'right', label: '%%right%%', event: { translationX: 150, velocityX: 900 } },
];

function App() {
  const [wishes, setWishes] = useState(initialWishes);
  const wanted = wishes.filter((wish) => !wish.acquired);
  const first = wanted[0];

  function acquire(id) {
    console.log(`acquire(${id})`);
    setWishes((current) => current.map((wish) => (wish.id === id ? { ...wish, acquired: true } : wish)));
  }

  const actionProps = first ? acquireActionProps('%%acquire%%', () => acquire(first.id)) : {};

  return (
    <View style={styles.screen}>
      {wanted.map((wish) => (
        <View key={wish.id} style={styles.row} accessible accessibilityLabel={wish.name}>
          <Text style={styles.name}>{wish.name}</Text>
        </View>
      ))}
      {first && (
        <>
          <Text>%%simulate%%</Text>
          <View style={styles.buttons}>
            {SWIPES.map((swipe) => (
              <Pressable key={swipe.id} accessibilityRole="button" style={styles.button} onPress={() => {
                console.log(`onSwipeEnd(${JSON.stringify(swipe.event)})`);
                onSwipeEnd(swipe.event, () => acquire(first.id));
              }}>
                <Text style={styles.buttonText}>{swipe.label}</Text>
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" style={styles.button} onPress={() => {
              const actions = actionProps.accessibilityActions ?? [];
              console.log(`accessibilityActions: ${JSON.stringify(actions)}`);
              actionProps.onAccessibilityAction?.({ nativeEvent: { actionName: 'acquire' } });
            }}>
              <Text style={styles.buttonText}>%%screenReader%%</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 12, gap: 8 },
  row: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#4b5563', borderRadius: 6 },
  name: { fontSize: 16 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#1d4ed8', borderRadius: 6 },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<App />);
