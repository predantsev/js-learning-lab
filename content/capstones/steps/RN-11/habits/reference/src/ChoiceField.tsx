// A labeled choice among a few values: one button per value, at least 48 points high. The chosen one
// carries a check mark in its visible text, so a screen reader reads the choice too.
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';

type ChoiceFieldProps = {
  label: string;
  options: { value: string; text: string }[];
  value: string;
  onChange: (value: string) => void;
  error: string; // "" when there is no error
};

export function ChoiceField({ label, options, value, onChange, error }: ChoiceFieldProps) {
  const errorRef = useRef<Text>(null);
  useEffect(() => {
    if (error !== '' && errorRef.current !== null) {
      AccessibilityInfo.sendAccessibilityEvent(errorRef.current, 'focus');
    }
  }, [error]);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.options}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            role="button"
            accessibilityLabel={label + ': ' + (option.value === value ? '✓ ' : '') + option.text}
            onPress={() => onChange(option.value)}
            style={[styles.option, option.value === value ? styles.chosen : null]}
          >
            <Text style={styles.optionText}>{(option.value === value ? '✓ ' : '') + option.text}</Text>
          </Pressable>
        ))}
      </View>
      {error !== '' ? (
        <Text ref={errorRef} accessible={true} style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 4 },
  label: { fontSize: 16, color: '#1a1a1a' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { minHeight: 48, minWidth: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: '#767676', borderRadius: 6, justifyContent: 'center' },
  chosen: { borderColor: '#1f4e8c', borderWidth: 2, backgroundColor: '#e8eef7' },
  optionText: { fontSize: 16, color: '#1a1a1a' },
  error: { color: '#b91c1c', fontSize: 15 },
});
