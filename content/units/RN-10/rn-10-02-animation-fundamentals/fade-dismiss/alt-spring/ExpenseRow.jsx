// ExpenseRow.jsx: a spring instead of a timing; it settles by itself instead of after a fixed duration.
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

export function ExpenseRow({ expense, onDismissed }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = translateX.interpolate({ inputRange: [-320, 0], outputRange: [0, 1], extrapolate: 'clamp' });

  function dismiss() {
    Animated.spring(translateX, { toValue: -320, damping: 26, stiffness: 180, useNativeDriver: false }).start(({ finished }) => {
      if (finished) onDismissed(expense.id);
    });
  }

  return (
    <Animated.View testID={`row-${expense.id}`} style={[styles.row, { opacity, transform: [{ translateX }] }]}>
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
