import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSimulatedInsets } from './DeviceFrame.jsx';

const expenses = [
  { id: 'e-01', label: '%%groceries%%' },
  { id: 'e-02', label: '%%pass%%' },
  { id: 'e-06', label: '%%lunch%%' },
];

export function ExpenseScreen() {
  const insets = useSimulatedInsets(); // on a device: useSafeAreaInsets()
  // Backgrounds stay full-bleed; only the content moves inside the safe area.
  const sides = { paddingLeft: 16 + insets.left, paddingRight: 16 + insets.right };
  return (
    <View style={styles.screen}>
      <View testID="header" style={[styles.header, sides, { paddingTop: 12 + insets.top }]}>
        <Text testID="title" style={styles.heading}>%%title%%</Text>
      </View>
      <View testID="list" style={styles.list}>
        {expenses.map((expense) => (
          <Text key={expense.id} testID="row" style={[styles.row, sides]}>{expense.label}</Text>
        ))}
      </View>
      <View testID="bar" style={[styles.bar, sides, { paddingBottom: 12 + insets.bottom }]}>
        <Pressable testID="add" role="button" style={styles.button}>
          <Text style={styles.buttonText}>%%add%%</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#e8eef7' },
  heading: { fontSize: 20, fontWeight: '600' },
  list: { flex: 1, backgroundColor: '#fff7e6' },
  row: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 16 },
  bar: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#e8eef7' },
  button: { minHeight: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1d4ed8', borderRadius: 8 },
  buttonText: { color: '#ffffff', fontSize: 16 },
});
