// The native habit tracker: the starting habits of data/habits.json, checked by the shared contract
// parseHabitList (data/model.ts), on one screen with the list and the form. SafeAreaProvider measures
// the notch and the system bars once, for every screen below it.
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { parseHabitList } from './data/model.ts';
import fixtures from './data/habits.json';
import { HabitsScreen } from './src/HabitsScreen.tsx';

const parsed = parseHabitList(fixtures.records);

export default function App() {
  return (
    <SafeAreaProvider>
      <HabitsScreen habits={parsed.ok ? parsed.value : []} loadFailed={!parsed.ok} />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
