// The hello screen of the native planner: one starting task, shown through the shared formatter
// formatTaskLabel of domain/tasks.ts, and whether it is done. The record comes from data/tasks.json,
// and the shared contract parseTaskList (data/model.ts) checks it before the screen uses it. All three
// files are copies from the React project (docs/shared-code.md).
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { formatTaskLabel, indexById } from './domain/tasks.ts';
import { parseTaskList } from './data/model.ts';
import fixtures from './data/tasks.json';

// The starting task this screen shows. Change it to another id of data/tasks.json to see another one.
const HELLO_ID = 't-01';

const parsed = parseTaskList(fixtures.records);
const record = parsed.ok ? indexById(parsed.value).get(HELLO_ID) : undefined;

export default function App() {
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>%%projectTitle%%</Text>
      {record ? (
        <>
          <Text style={styles.record}>{formatTaskLabel(record)}</Text>
          <Text style={styles.record}>{record.done ? '%%doneMark%%' : '%%pendingMark%%'}</Text>
        </>
      ) : (
        <Text style={styles.record}>%%notFoundTitle%%</Text>
      )}
      <Text style={styles.note}>%%platformLabel%%: {Platform.OS}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  record: {
    fontSize: 18,
    color: '#1a1a1a',
  },
  note: {
    fontSize: 14,
    color: '#4a4a4a',
  },
});
