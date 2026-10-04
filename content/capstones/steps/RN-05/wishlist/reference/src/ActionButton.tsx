// A button of a list row or a form: at least 48 × 48 points, announced as a button by its text.
import { Pressable, StyleSheet, Text } from 'react-native';

type ActionButtonProps = {
  text: string;
  onPress: () => void;
  kind?: 'primary' | 'plain' | 'danger';
};

export function ActionButton({ text, onPress, kind = 'plain' }: ActionButtonProps) {
  return (
    <Pressable role="button" onPress={onPress} style={({ pressed }) => [styles.button, styles[kind], pressed ? styles.pressed : null]}>
      <Text style={kind === 'primary' ? styles.primaryText : kind === 'danger' ? styles.dangerText : styles.plainText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, minWidth: 48, borderRadius: 6, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: '#1f4e8c' },
  plain: { borderWidth: 1, borderColor: '#767676' },
  danger: { borderWidth: 1, borderColor: '#b91c1c' },
  pressed: { opacity: 0.7 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  plainText: { color: '#1a1a1a', fontSize: 16 },
  dangerText: { color: '#b91c1c', fontSize: 16 },
});
