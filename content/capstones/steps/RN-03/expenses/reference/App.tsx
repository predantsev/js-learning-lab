// The native expense tracker: the starting expenses of data/expenses.json, checked by the shared
// contract parseExpenseList (data/model.ts). The platform adapters are chosen here and only here: a
// storage (in memory for now) and the money format of the project's language. SafeAreaProvider
// measures the notch and the system bars once, for every screen below it.
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { parseExpenseList } from './data/model.ts';
import fixtures from './data/expenses.json';
import { createMemoryStorage, createMoneyFormat } from './src/adapters.ts';
import { ExpensesScreen } from './src/ExpensesScreen.tsx';

const parsed = parseExpenseList(fixtures.records);
const storage = createMemoryStorage();
const format = createMoneyFormat('%%formatLocale%%');

export default function App() {
  return (
    <SafeAreaProvider>
      <ExpensesScreen initialExpenses={parsed.ok ? parsed.value : []} loadFailed={!parsed.ok} storage={storage} format={format} />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
