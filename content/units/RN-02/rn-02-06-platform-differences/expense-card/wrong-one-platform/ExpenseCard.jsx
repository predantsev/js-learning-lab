import { Platform, StyleSheet, Text, View } from 'react-native';

// Misconception: both platforms render the same thing, so the iOS shadow is enough for Android too.
export const shadowSpec = {
  default: { shadowColor: '#000000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
};

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
