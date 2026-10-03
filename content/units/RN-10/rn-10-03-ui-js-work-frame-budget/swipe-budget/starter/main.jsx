// Shows the frame budget and the handlers to move for a 60 Hz and a 120 Hz screen. Do not edit.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { frameBudgetMs, handlersToMove } from './budget.js';
import { expenseHandlers } from './handlers.js';

function Screen({ hz }) {
  const budget = frameBudgetMs(hz);
  const names = handlersToMove(expenseHandlers, hz);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{hz} Hz</Text>
      <Text>%%budget%%: {Number.isFinite(budget) ? budget.toFixed(2) : String(budget)} ms</Text>
      <Text>%%move%%: {names.length ? names.join(', ') : '—'}</Text>
    </View>
  );
}

function App() {
  return (
    <View style={styles.screen}>
      <Screen hz={60} />
      <Screen hz={120} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 12, gap: 12 },
  card: { padding: 12, gap: 4, borderWidth: 1, borderColor: '#4b5563', borderRadius: 6 },
  title: { fontSize: 16, fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<App />);
