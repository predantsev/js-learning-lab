// The native planner: the starting tasks of data/tasks.json, checked by the shared contract
// parseTaskList (data/model.ts). The platform adapters are chosen here and only here: a storage
// (in memory for now) and the date format of the project's language. SafeAreaProvider measures the
// notch and the system bars once, for every screen below it.
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { parseTaskList } from './data/model.ts';
import fixtures from './data/tasks.json';
import { createDateFormat, createMemoryStorage } from './src/adapters.ts';
import { TasksScreen } from './src/TasksScreen.tsx';

const parsed = parseTaskList(fixtures.records);
const storage = createMemoryStorage();
const format = createDateFormat('%%formatLocale%%', '%%noDueDate%%');

export default function App() {
  return (
    <SafeAreaProvider>
      <TasksScreen initialTasks={parsed.ok ? parsed.value : []} loadFailed={!parsed.ok} storage={storage} format={format} />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
