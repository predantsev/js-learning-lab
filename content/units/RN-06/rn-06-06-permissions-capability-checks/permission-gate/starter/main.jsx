// A photo-attachment lab screen (synthetic, not part of the project) driven by usePermissionGate,
// in the browser preview (react-native-web). The buttons below the line play the user and the system.
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cameraAdapter, onForeground, returnToForeground, sim } from './permissionSim.js';
import { usePermissionGate } from './usePermissionGate.js';

function PhotoLab() {
  const { state, request } = usePermissionGate(cameraAdapter, onForeground);
  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>%%heading%%</Text>
      <Text testID="gate-state" style={styles.state}>{state}</Text>
      <Pressable testID="ask" accessibilityRole="button" onPress={request} style={styles.button}>
        <Text style={styles.buttonText}>%%ask%%</Text>
      </Pressable>
      <View style={styles.sim}>
        <Text style={styles.simTitle}>%%simulation%%</Text>
        {['granted', 'denied', 'denied-forever'].map((value) => (
          <Pressable key={value} accessibilityRole="button" onPress={() => { sim.nextAnswer = value; }} style={styles.simButton}>
            <Text>{`%%nextAnswer%%: ${value}`}</Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" onPress={() => { sim.status = 'denied'; sim.canAskAgain = true; returnToForeground(); }} style={styles.simButton}>
          <Text>%%revoke%%</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 10 },
  heading: { fontSize: 18, fontWeight: '600' },
  state: { fontFamily: 'monospace', fontSize: 16 },
  button: { alignSelf: 'flex-start', padding: 12, borderRadius: 6, backgroundColor: '#1d4ed8' },
  buttonText: { color: '#ffffff', fontWeight: '600' },
  sim: { marginTop: 12, paddingTop: 12, gap: 6, borderTopWidth: 1, borderColor: '#767676' },
  simTitle: { color: '#4b4b4b' },
  simButton: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#767676', borderRadius: 6 },
});

createRoot(document.getElementById('root')).render(<PhotoLab />);
