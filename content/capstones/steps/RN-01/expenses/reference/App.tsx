// The hello screen of the native expense tracker: one starting expense, shown through the shared
// formatter formatExpenseLabel of domain/expenses.ts, with its date and its category. The record comes
// from data/expenses.json, and the shared contract parseExpenseList (data/model.ts) checks it before the
// screen uses it. All three files are copies from the React project (docs/shared-code.md).
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { categoryText, formatExpenseLabel, indexById } from './domain/expenses.ts';
import { parseExpenseList } from './data/model.ts';
import fixtures from './data/expenses.json';

// The starting expense this screen shows. Change it to another id of data/expenses.json to see another one.
const HELLO_ID = 'e-01';

const parsed = parseExpenseList(fixtures.records);
const record = parsed.ok ? indexById(parsed.value).get(HELLO_ID) : undefined;

export default function App() {
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>%%projectTitle%%</Text>
      {record ? (
        <>
          <Text style={styles.record}>{formatExpenseLabel(record)}</Text>
          <Text style={styles.record}>{record.date} · {categoryText(record.category)}</Text>
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
