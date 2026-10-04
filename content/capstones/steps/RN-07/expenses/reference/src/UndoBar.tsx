// What the last swipe did, with a way back, for five seconds. The screen gives every new swipe a new
// key, so a new bar starts its own timer; the cleanup clears the timer when the bar goes away first.
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionButton } from './ActionButton.tsx';

type UndoBarProps = {
  message: string;
  onUndo: () => void;
  onClose: () => void;
};

export function UndoBar({ message, onUndo, onClose }: UndoBarProps) {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
      <Text style={styles.message} accessibilityRole="alert">
        {message}
      </Text>
      <ActionButton text="%%undoLabel%%" kind="primary" onPress={onUndo} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#e8eef7', borderTopWidth: 1, borderColor: '#d4d4d4' },
  message: { flexShrink: 1, flexGrow: 1, fontSize: 15, color: '#1a1a1a' },
});
