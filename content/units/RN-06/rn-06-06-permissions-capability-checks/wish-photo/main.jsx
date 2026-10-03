// A lab screen (synthetic, not part of the project): attach a photo to a wish.
// The camera and the system dialog are simulated by permissionSim.js. Browser preview (react-native-web).
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cameraAdapter, sim } from './permissionSim.js';

// What the simulated user taps in the system dialog: 'granted', 'denied' or 'denied-forever'.
sim.nextAnswer = 'denied';

function WishPhoto() {
  const [permission, setPermission] = useState(null);
  const [photos, setPhotos] = useState(0);

  useEffect(() => {
    cameraAdapter.getPermission().then(setPermission); // a check: no dialog
  }, []);

  async function takePhoto() {
    const answer = await cameraAdapter.requestPermission(); // the dialog may appear only here
    setPermission(answer);
    if (answer.status === 'granted') setPhotos((n) => n + 1);
  }

  const showCamera = true; // the defect: shown even when asking can no longer help

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>%%heading%%</Text>
      <Text>%%rationale%%</Text>
      {permission && <Text style={styles.state}>{`status: ${permission.status}, canAskAgain: ${permission.canAskAgain}`}</Text>}
      {showCamera ? (
        <Pressable accessibilityRole="button" onPress={takePhoto} style={styles.button}>
          <Text style={styles.buttonText}>%%takePhoto%%</Text>
        </Pressable>
      ) : (
        <Text style={styles.blocked}>%%blockedHint%%</Text>
      )}
      <Text>{`%%photos%%: ${photos}`}</Text>
      <Text style={styles.note}>{`%%requests%%: ${sim.requests}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 10 },
  heading: { fontSize: 18, fontWeight: '600' },
  state: { fontFamily: 'monospace', color: '#4b4b4b' },
  button: { alignSelf: 'flex-start', padding: 12, borderRadius: 6, backgroundColor: '#1d4ed8' },
  buttonText: { color: '#ffffff', fontWeight: '600' },
  blocked: { color: '#7c2d12' },
  note: { fontSize: 13, color: '#4b4b4b' },
});

createRoot(document.getElementById('root')).render(<WishPhoto />);
