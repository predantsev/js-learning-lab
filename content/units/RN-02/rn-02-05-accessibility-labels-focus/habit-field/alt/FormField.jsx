import { useLayoutEffect, useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { moveAccessibilityFocus } from './a11yFocus.js';

// Another valid approach: the ARIA-style aria-label prop (React Native supports it too)
// and a layout effect that moves focus right after the error is drawn.
export function FormField({ label, value, onChangeText, error }) {
  const errorRef = useRef(null);
  useLayoutEffect(() => {
    if (error !== null) moveAccessibilityFocus(errorRef);
  }, [error]);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput aria-label={label} value={value} onChangeText={onChangeText} style={styles.input} />
      {error ? <Text ref={errorRef} accessible={true} style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 4 },
  label: { fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#767676', borderRadius: 6, padding: 10, fontSize: 16 },
  error: { color: '#b91c1c', fontSize: 15 },
});
