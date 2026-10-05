// DialogPanel.jsx: draws the simulated system dialog under the app. Do not edit.
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function DialogPanel({ device }) {
  const [info, setInfo] = useState(device.panel.info());
  useEffect(() => device.panel.subscribe(() => setInfo(device.panel.info())), [device]);
  return (
    <View style={styles.panel}>
      <Text style={styles.status}>
        camera: {String(info.hasCamera)} · status: {info.status} · canAskAgain: {String(info.canAskAgain)} · dialogs: {info.dialogsShown}
      </Text>
      {info.dialogOpen && (
        <View accessibilityRole="alert" style={styles.dialog}>
          <Text style={styles.text}>%%dialogText%%</Text>
          <View style={styles.row}>
            <Pressable accessibilityRole="button" style={styles.button} onPress={() => device.panel.answerDialog(false)}>
              <Text>%%dontAllow%%</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.button} onPress={() => device.panel.answerDialog(true)}>
              <Text>%%allow%%</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { marginTop: 16, padding: 10, gap: 8, borderTopWidth: 2, borderColor: '#4b5563', backgroundColor: '#f3f4f6' },
  status: { fontFamily: 'monospace', fontSize: 12, color: '#1f2937' },
  dialog: { padding: 10, gap: 8, borderWidth: 1, borderColor: '#1f2937', borderRadius: 8, backgroundColor: '#ffffff' },
  text: { fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8 },
  button: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center', borderWidth: 1, borderColor: '#374151', borderRadius: 6 },
});
