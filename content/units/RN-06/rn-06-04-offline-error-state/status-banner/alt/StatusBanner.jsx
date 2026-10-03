import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ACTIONS, MESSAGES } from './texts.js';

function ActionButton({ label, onPress }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

export function StatusBanner({ failure, onRetry, onUseBundled }) {
  if (!failure) return null;
  let action;
  switch (failure) {
    case 'timeout':
    case 'server':
      action = <ActionButton label={ACTIONS.retry} onPress={onRetry} />;
      break;
    default:
      action = <ActionButton label={ACTIONS.useBundled} onPress={onUseBundled} />;
  }
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text>{MESSAGES[failure]}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { padding: 12, gap: 8, backgroundColor: '#fff4e5', borderWidth: 1, borderColor: '#b45309', borderRadius: 8 },
  action: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6, backgroundColor: '#1d4ed8' },
  actionText: { color: '#ffffff', fontWeight: '600' },
});
