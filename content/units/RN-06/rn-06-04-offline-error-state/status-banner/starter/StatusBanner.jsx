import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ACTIONS, MESSAGES } from './texts.js';

// failure: null, 'offline', 'timeout', 'server' or 'invalid'.
// TODO: show the message for this failure and the one action that helps (see the task).
export function StatusBanner({ failure, onRetry, onUseBundled }) {
  if (failure === null) return null;
  return (
    <View style={styles.banner}>
      <Text>{MESSAGES.server}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.action}>
        <Text style={styles.actionText}>{ACTIONS.retry}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { padding: 12, gap: 8, backgroundColor: '#fff4e5', borderWidth: 1, borderColor: '#b45309', borderRadius: 8 },
  action: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6, backgroundColor: '#1d4ed8' },
  actionText: { color: '#ffffff', fontWeight: '600' },
});
