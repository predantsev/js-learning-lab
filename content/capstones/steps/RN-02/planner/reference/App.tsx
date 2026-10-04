// The native planner: the starting tasks of data/tasks.json, checked by the shared contract
// parseTaskList (data/model.ts), on one screen with the list and the form. SafeAreaProvider measures
// the notch and the system bars once, for every screen below it.
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { parseTaskList } from './data/model.ts';
import fixtures from './data/tasks.json';
import { TasksScreen } from './src/TasksScreen.tsx';

const parsed = parseTaskList(fixtures.records);

export default function App() {
  return (
    <SafeAreaProvider>
      <TasksScreen tasks={parsed.ok ? parsed.value : []} loadFailed={!parsed.ok} />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
