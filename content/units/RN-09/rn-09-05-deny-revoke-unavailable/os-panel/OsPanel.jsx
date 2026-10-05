// OsPanel.jsx: the controls of the simulated OS, drawn under the app. Do not edit.
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function PanelButton({ label, onPress }) {
  return (
    <Pressable accessibilityRole="button" style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function OsPanel({ os }) {
  const [info, setInfo] = useState(os.panel.info());
  useEffect(() => os.panel.subscribe(() => setInfo(os.panel.info())), [os]);

  return (
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.heading}>%%osTitle%% ({info.platform})</Text>
      <Text style={styles.status}>
        camera: {String(info.hasCamera)} · status: {info.status} · canAskAgain: {String(info.canAskAgain)} · %%dialogs%%: {info.dialogsShown}
      </Text>
      {info.dialogOpen && (
        <View accessibilityRole="alert" style={styles.dialog}>
          <Text style={styles.dialogText}>%%dialogText%%</Text>
          <View style={styles.row}>
            <PanelButton label="%%dontAllow%%" onPress={() => os.panel.answerDialog(false)} />
            <PanelButton label="%%allow%%" onPress={() => os.panel.answerDialog(true)} />
          </View>
        </View>
      )}
      <View style={styles.row}>
        <PanelButton label="%%settingsAllow%%" onPress={os.panel.settingsAllow} />
        <PanelButton label="%%settingsRevoke%%" onPress={os.panel.settingsRevoke} />
        <PanelButton label="%%leaveReturn%%" onPress={os.panel.leaveAndReturn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { marginTop: 16, padding: 10, gap: 8, borderTopWidth: 2, borderColor: '#4b5563', backgroundColor: '#f3f4f6' },
  heading: { fontWeight: '700' },
  status: { fontFamily: 'monospace', fontSize: 12, color: '#1f2937' },
  dialog: { padding: 10, gap: 8, borderWidth: 1, borderColor: '#1f2937', borderRadius: 8, backgroundColor: '#ffffff' },
  dialogText: { fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center', borderWidth: 1, borderColor: '#374151', borderRadius: 6, backgroundColor: '#ffffff' },
  buttonText: { color: '#111827' },
});
