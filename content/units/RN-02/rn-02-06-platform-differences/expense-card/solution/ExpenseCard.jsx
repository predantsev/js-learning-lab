import { Platform, StyleSheet, Text, View } from 'react-native';

// The object passed to Platform.select is exported as shadowSpec, so the checks can try it for iOS and Android.
export const shadowSpec = {
  ios: { shadowColor: '#000000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  android: { elevation: 3 },
  default: { borderWidth: 1, borderColor: '#767676' },
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
