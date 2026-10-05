import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ACTIONS, MESSAGES } from './texts.js';

// Wrong on purpose: one message for every failure, so the user cannot tell what to do.
export function StatusBanner({ failure, onRetry, onUseBundled }) {
  if (failure === null) return null;
  const retry = failure === 'timeout' || failure === 'server';
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text>{MESSAGES.server}</Text>
      <Pressable accessibilityRole="button" onPress={retry ? onRetry : onUseBundled} style={styles.action}>
        <Text style={styles.actionText}>{retry ? ACTIONS.retry : ACTIONS.useBundled}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { padding: 12, gap: 8, backgroundColor: '#fff4e5', borderWidth: 1, borderColor: '#b45309', borderRadius: 8 },
  action: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6, backgroundColor: '#1d4ed8' },
  actionText: { color: '#ffffff', fontWeight: '600' },
});
