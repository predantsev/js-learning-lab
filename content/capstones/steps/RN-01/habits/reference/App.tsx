// The hello screen of the native habit tracker: one starting habit, shown through the shared formatter
// formatHabitLabel of domain/habits.ts, and how many completions it has. The record comes from
// data/habits.json, and the shared contract parseHabitList (data/model.ts) checks it before the screen
// uses it. All three files are copies from the React project (docs/shared-code.md).
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { formatHabitLabel, indexById } from './domain/habits.ts';
import { parseHabitList } from './data/model.ts';
import fixtures from './data/habits.json';

// The starting habit this screen shows. Change it to another id of data/habits.json to see another one.
const HELLO_ID = 'h-01';

const parsed = parseHabitList(fixtures.records);
const record = parsed.ok ? indexById(parsed.value).get(HELLO_ID) : undefined;

export default function App() {
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>%%projectTitle%%</Text>
      {record ? (
        <>
          <Text style={styles.record}>{formatHabitLabel(record)}</Text>
          <Text style={styles.record}>%%completionsLabel%%: {record.completions.length}</Text>
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
