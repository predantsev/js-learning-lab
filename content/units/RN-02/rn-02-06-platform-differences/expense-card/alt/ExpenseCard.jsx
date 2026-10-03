import { Platform, StyleSheet, Text, View } from 'react-native';

// Another valid approach: only the two native branches, no fallback for the web
// (Platform.select then returns undefined in the preview, and the card simply has no shadow there).
export const shadowSpec = {
  ios: { shadowColor: '#1f1f1f', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  android: { elevation: 6 },
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
