// ExpenseRow.jsx: animates by setting React state on every frame, so every frame is a render and a commit.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function ExpenseRow({ expense, onDismissed }) {
  const [offset, setOffset] = useState(0);

  function dismiss() {
    const start = performance.now();
    function frame(now) {
      const progress = Math.min((now - start) / 250, 1);
      setOffset(-320 * progress);
      if (progress < 1) requestAnimationFrame(frame);
      else onDismissed(expense.id);
    }
    requestAnimationFrame(frame);
  }

  return (
    <View testID={`row-${expense.id}`} style={[styles.row, { opacity: 1 + offset / 320, transform: [{ translateX: offset }] }]}>
      <Text style={styles.label}>{expense.label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`%%remove%%: ${expense.label}`} onPress={dismiss} style={styles.button}>
        <Text>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12, borderWidth: 1, borderColor: '#4b5563', borderRadius: 6, backgroundColor: '#ffffff' },
  label: { flex: 1, fontSize: 16 },
  button: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
