// Shows the expense list with a button that reverses its order (every row renders again). Do not edit.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { expenses } from './expenses.js';
import { ExpenseList } from './ExpenseList.jsx';
import { formatterStats } from './format.js';

function App() {
  const [newestFirst, setNewestFirst] = useState(false);
  const shown = newestFirst ? [...expenses].reverse() : expenses;
  return (
    <View style={styles.screen}>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => setNewestFirst(!newestFirst)}>
        <Text style={styles.buttonText}>%%reverse%%</Text>
      </Pressable>
      <Text>%%created%%: {formatterStats.created}</Text>
      <ExpenseList expenses={shown} locale="%%locale%%" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 12, gap: 8, height: 420 },
  button: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#1d4ed8', borderRadius: 6 },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<App />);
