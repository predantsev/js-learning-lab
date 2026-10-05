import { Platform, StyleSheet, Text, View } from 'react-native';

// The object passed to Platform.select is exported as shadowSpec, so the checks can try it for iOS and Android.
export const shadowSpec = {};

const shadow = Platform.select(shadowSpec);

export function ExpenseCard({ expense }) {
  return (
    <View testID="card" style={[styles.card, shadow]}>
      <Text style={styles.label}>{expense.label}</Text>
      <Text>{expense.amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 4, borderRadius: 12, backgroundColor: '#ffffff' },
  label: { fontSize: 18, fontWeight: '600' },
});
