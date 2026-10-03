import { useEffect, useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { moveAccessibilityFocus } from './a11yFocus.js';

// 1. A screen reader must announce the field by its visible label.
// 2. When an error appears, screen-reader focus must move to it.
export function FormField({ label, value, onChangeText, error }) {
  const errorRef = useRef(null);
  useEffect(() => {
    if (error) moveAccessibilityFocus(errorRef);
  }, [error]);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} style={styles.input} />
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
