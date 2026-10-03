import { StyleSheet, Text, View } from 'react-native';
import { apiUrl } from './config.js';
import { summarizeExpenses } from './domain/summarize.js';

// Native screen code may use __DEV__: it only ever runs in the native app.
export function SettingsScreen({ expenses, labels }) {
  const totalMinor = summarizeExpenses(expenses);
  if (__DEV__) console.log(`[dev] ${expenses.length} expenses, total ${totalMinor}`);
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>{labels.title}</Text>
      <Text>{labels.server}: {String(apiUrl)}</Text>
      <Text>{labels.total}: {(totalMinor / 100).toFixed(2)} {labels.currency}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 6 },
  title: { fontSize: 20, fontWeight: '600' },
});
