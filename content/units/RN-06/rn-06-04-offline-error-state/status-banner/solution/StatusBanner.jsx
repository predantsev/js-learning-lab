import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ACTIONS, MESSAGES } from './texts.js';

// Which action helps after each failure: asking again, or falling back to the bundled data.
const NEXT_ACTION = {
  offline: 'useBundled', // no network: another request fails the same way
  timeout: 'retry',
  server: 'retry',
  invalid: 'useBundled', // the same broken body would come again
};

export function StatusBanner({ failure, onRetry, onUseBundled }) {
  if (failure === null) return null;
  const action = NEXT_ACTION[failure];
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text>{MESSAGES[failure]}</Text>
      <Pressable accessibilityRole="button" onPress={action === 'retry' ? onRetry : onUseBundled} style={styles.action}>
        <Text style={styles.actionText}>{ACTIONS[action]}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { padding: 12, gap: 8, backgroundColor: '#fff4e5', borderWidth: 1, borderColor: '#b45309', borderRadius: 8 },
  action: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6, backgroundColor: '#1d4ed8' },
  actionText: { color: '#ffffff', fontWeight: '600' },
});
