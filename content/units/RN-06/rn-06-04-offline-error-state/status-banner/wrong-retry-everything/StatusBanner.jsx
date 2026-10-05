import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ACTIONS, MESSAGES } from './texts.js';

// Wrong on purpose: "Try again" for every failure, also where the same result would come back.
export function StatusBanner({ failure, onRetry }) {
  if (failure === null) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text>{MESSAGES[failure]}</Text>
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
