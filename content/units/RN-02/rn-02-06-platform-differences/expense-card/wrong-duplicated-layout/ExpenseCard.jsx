import { Platform, StyleSheet, Text, View } from 'react-native';

// Misconception: everything that belongs to a platform goes into its branch — the layout is copied twice
// and the web/preview branch got none of it.
export const shadowSpec = {
  ios: { padding: 16, gap: 4, borderRadius: 12, backgroundColor: '#ffffff', shadowColor: '#000000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  android: { padding: 16, gap: 4, borderRadius: 12, backgroundColor: '#ffffff', elevation: 3 },
};

const shadow = Platform.select(shadowSpec);

export function ExpenseCard({ expense }) {
  return (
    <View testID="card" style={shadow}>
      <Text style={styles.label}>{expense.label}</Text>
      <Text>{expense.amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 18, fontWeight: '600' },
});
