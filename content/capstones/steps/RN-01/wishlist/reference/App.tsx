// The hello screen of the native wishlist: one starting wish, shown through the shared formatter
// formatItemLabel of domain/wishes.ts. The record comes from data/wishes.json, and the shared contract
// parseItemList (data/model.ts) checks it before the screen uses it. All three files are copies from
// the React project (docs/shared-code.md).
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { formatItemLabel, indexById } from './domain/wishes.ts';
import { parseItemList } from './data/model.ts';
import fixtures from './data/wishes.json';

// The starting wish this screen shows. Change it to another id of data/wishes.json to see another one.
const HELLO_ID = 'w-01';

const parsed = parseItemList(fixtures.records);
const record = parsed.ok ? indexById(parsed.value).get(HELLO_ID) : undefined;

export default function App() {
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>%%projectTitle%%</Text>
      <Text style={styles.record}>{record ? formatItemLabel(record) : '%%notFoundTitle%%'}</Text>
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
