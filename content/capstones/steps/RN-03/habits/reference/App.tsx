// The native habit tracker: the starting habits of data/habits.json, checked by the shared contract
// parseHabitList (data/model.ts). The platform adapters are chosen here and only here: a storage
// (in memory for now) and the device's clock. SafeAreaProvider measures the notch and the system bars
// once, for every screen below it.
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { parseHabitList } from './data/model.ts';
import fixtures from './data/habits.json';
import { createMemoryStorage, createSystemClock } from './src/adapters.ts';
import { HabitsScreen } from './src/HabitsScreen.tsx';

const parsed = parseHabitList(fixtures.records);
const storage = createMemoryStorage();
const clock = createSystemClock();

export default function App() {
  return (
    <SafeAreaProvider>
      <HabitsScreen initialHabits={parsed.ok ? parsed.value : []} loadFailed={!parsed.ok} storage={storage} clock={clock} />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
