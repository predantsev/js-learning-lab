// The expenses screen (read-only): it only shows what useExpenses reports.
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useExpenses } from './useExpenses.js';

export function ExpensesScreen({ storage, labels, newExpense }) {
  const { status, records, retry, add } = useExpenses(storage);

  if (status === 'loading') {
    return (
      <View style={styles.screen} testID="loading">
        <ActivityIndicator />
        <Text>{labels.loading}</Text>
      </View>
    );
  }
  if (status === 'failed') {
    return (
      <View style={styles.screen} testID="failed">
        <Text>{labels.failed}</Text>
        <Pressable role="button" style={styles.button} onPress={retry}>
          <Text style={styles.buttonText}>{labels.retry}</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={styles.screen}>
      {status === 'empty' ? <Text testID="empty">{labels.empty}</Text> : null}
      {records.map((expense) => (
        <Text key={expense.id} testID="expense" style={styles.row}>{expense.label}</Text>
      ))}
      <Pressable role="button" style={styles.button} onPress={() => add(newExpense)}>
        <Text style={styles.buttonText}>{labels.add}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 8 },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  button: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#1d4ed8', borderRadius: 6 },
  buttonText: { color: '#ffffff' },
});
