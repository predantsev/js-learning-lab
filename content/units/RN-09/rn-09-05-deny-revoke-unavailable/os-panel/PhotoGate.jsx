// PhotoGate.jsx: the "progress photo" button of a habit lab screen, guarded by the camera permission.
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function PhotoGate({ os }) {
  const [hasCamera, setHasCamera] = useState(null);
  const [permission, setPermission] = useState(null); // the last answer this screen saw

  useEffect(() => {
    os.hasCamera().then(setHasCamera);
    os.getPermission().then(setPermission);
  }, [os]);

  // Re-read the permission every time the app comes back to the foreground.
  // useEffect(() => {
  //   const subscription = os.appState.addEventListener('change', async (next) => {
  //     if (next === 'active') setPermission(await os.getPermission());
  //   });
  //   return () => subscription.remove();
  // }, [os]);

  async function ask() {
    setPermission(await os.requestPermission());
  }

  if (hasCamera === null || permission === null) return <Text>…</Text>;

  let message;
  let action = null;
  if (!hasCamera) message = '%%noCamera%%';
  else if (permission.granted) message = '%%ready%%';
  else if (permission.status === 'undetermined') {
    message = '%%explain%%';
    action = { label: '%%addPhoto%%', onPress: ask };
  } else if (permission.canAskAgain) {
    message = '%%rationale%%';
    action = { label: '%%askAgain%%', onPress: ask };
  } else message = '%%blocked%%';

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>%%habit%%</Text>
      <Text>{message}</Text>
      {action && (
        <Pressable accessibilityRole="button" style={styles.button} onPress={action.onPress}>
          <Text style={styles.buttonText}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, gap: 10 },
  heading: { fontSize: 18, fontWeight: '700' },
  button: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1d4ed8', borderRadius: 6 },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});
