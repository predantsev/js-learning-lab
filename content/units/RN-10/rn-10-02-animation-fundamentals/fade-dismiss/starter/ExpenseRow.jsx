// ExpenseRow.jsx: one expense with a remove button that animates the row away.
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

export function ExpenseRow({ expense, onDismissed }) {
  const translateX = useRef(new Animated.Value(0)).current;

  function dismiss() {
    // TODO: slide the row to translateX -320 in 250 ms and call onDismissed(expense.id) once it has finished.
  }

  return (
    <Animated.View testID={`row-${expense.id}`} style={[styles.row /* TODO: translateX, and an opacity derived from it */]}>
      <Text style={styles.label}>{expense.label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`%%remove%%: ${expense.label}`} onPress={dismiss} style={styles.button}>
        <Text>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12, borderWidth: 1, borderColor: '#4b5563', borderRadius: 6, backgroundColor: '#ffffff' },
  label: { flex: 1, fontSize: 16 },
  button: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
