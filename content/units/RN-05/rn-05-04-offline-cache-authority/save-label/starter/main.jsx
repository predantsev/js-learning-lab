// Preview plumbing (read-only): expense rows in different save states and a simulated
// connectivity switch. SERVER_URL is null: this app has no server (that comes in NO-06).
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ExpenseRow } from './ExpenseRow.jsx';

const SERVER_URL = null;

const expenses = [
  { id: 'e-01', label: '%%groceries%%', amountMinor: 84550, date: '2026-03-01', category: 'food', save: 'saved' },
  { id: 'e-02', label: '%%transit%%', amountMinor: 52000, date: '2026-03-01', category: 'transport', save: 'saving' },
  { id: 'e-03', label: '%%coffee%%', amountMinor: 18000, date: '2026-02-28', category: 'fun', save: 'failed' },
  // An old flag from a test build: there is no server, so nobody could have confirmed it.
  { id: 'e-04', label: '%%bulbs%%', amountMinor: 9990, date: '2026-02-27', category: 'home', save: 'saved', uploaded: true },
];

const labels = {
  saving: '%%saving%%',
  'saved-on-device': '%%savedOnDevice%%',
  'not-saved': '%%notSaved%%',
  'pending-upload': '%%pendingUpload%%',
  synced: '%%synced%%',
};

function App() {
  const [online, setOnline] = useState(true);
  const context = { serverConfigured: SERVER_URL !== null, online };
  return (
    <View style={styles.page}>
      <View style={styles.phone}>
        {expenses.map((expense) => (
          <ExpenseRow key={expense.id} expense={expense} context={context} labels={labels} />
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
