import { Pressable, StyleSheet, Text, View } from 'react-native';

// One wish with its save badge. `save` is 'saving' | 'saved' | 'failed' — the result of the
// last write to the device store. `online` comes from the simulated connectivity switch.
export function WishRow({ wish, save, online, labels, onToggle }) {
  let badge = labels.saving;
  if (save === 'failed') badge = labels.notSaved;
  if (save === 'saved') badge = online ? labels.synced : labels.offline;

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.name}>{wish.name}</Text>
        <Text testID="badge" style={styles.badge}>{badge}</Text>
      </View>
      <Pressable role="button" style={styles.button} onPress={onToggle}>
        <Text style={styles.buttonText}>{wish.acquired ? labels.acquired : labels.wanted}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  text: { flex: 1, gap: 2 },
  name: { fontSize: 16 },
  badge: { fontSize: 13, color: '#3d3d3d' },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#e5e7eb', borderRadius: 6 },
  buttonText: { color: '#111827' },
});
