// Shows the swipeable expense list with buttons that SIMULATE swipes on the third row. Do not edit.
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ExpenseSwipeList } from './ExpenseSwipeList.jsx';
import { swipe } from './swipeSim.js';

export const initialExpenses = [
  { id: 'e-01', label: '%%groceries%%', amountMinor: 84550, date: '2026-03-01', category: 'food' },
  { id: 'e-02', label: '%%pass%%', amountMinor: 52000, date: '2026-03-01', category: 'transport' },
  { id: 'e-03', label: '%%coffee%%', amountMinor: 18000, date: '2026-02-28', category: 'fun' },
  { id: 'e-04', label: '%%bulbs%%', amountMinor: 9990, date: '2026-02-27', category: 'home' },
  { id: 'e-05', label: '%%cinema%%', amountMinor: 30000, date: '2026-02-27', category: 'fun' },
  { id: 'e-06', label: '%%lunch%%', amountMinor: 21050, date: '2026-03-02', category: 'food' },
];

const slowSwipe = Array.from({ length: 30 }, (_, i) => -4 * (i + 1)); // 30 updates, ends at −120 (opens)

function App() {
  return (
    <View style={styles.screen}>
      <View style={styles.buttons}>
        <Pressable accessibilityRole="button" style={styles.button} onPress={() => swipe('e-03', slowSwipe)}>
          <Text style={styles.buttonText}>%%openCoffee%%</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.button} onPress={() => swipe('e-01', [-100, -220])}>
          <Text style={styles.buttonText}>%%deleteFirst%%</Text>
        </Pressable>
      </View>
      <ExpenseSwipeList initialExpenses={initialExpenses} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 12, gap: 8 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#1d4ed8', borderRadius: 6 },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<App />);
