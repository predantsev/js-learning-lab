// The native expense tracker: the starting expenses of data/expenses.json, checked by the shared
// contract parseExpenseList (data/model.ts), on one screen with the list and the form. SafeAreaProvider
// measures the notch and the system bars once, for every screen below it.
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { parseExpenseList } from './data/model.ts';
import fixtures from './data/expenses.json';
import { ExpensesScreen } from './src/ExpensesScreen.tsx';

const parsed = parseExpenseList(fixtures.records);

export default function App() {
  return (
    <SafeAreaProvider>
      <ExpensesScreen expenses={parsed.ok ? parsed.value : []} loadFailed={!parsed.ok} />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
