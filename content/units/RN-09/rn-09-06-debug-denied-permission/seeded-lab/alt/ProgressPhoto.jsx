// ProgressPhoto.jsx: the same repair, keeping the last permission answer and a camera failure flag.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraPreview } from './labDevice.jsx';

function Button({ label, onPress }) {
  return (
    <Pressable accessibilityRole="button" style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function ProgressPhoto({ device }) {
  const [answer, setAnswer] = useState(null); // the last permission answer, or null before asking
  const [cameraFailed, setCameraFailed] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [saved, setSaved] = useState(false);

  const ask = async () => setAnswer(await device.requestPermission());
  const skip = <Button label="%%withoutPhoto%%" onPress={() => setSaved(true)} />;

  let body;
  if (saved) body = <Text>%%savedWithout%%</Text>;
  else if (answer === null) {
    body = (
      <>
        <Text accessibilityRole="header" style={styles.heading}>%%habit%%</Text>
        <Button label="%%takePhoto%%" onPress={ask} />
      </>
    );
  } else if (answer.granted && cameraFailed) body = <><Text>%%noCamera%%</Text>{skip}</>;
  else if (answer.granted) {
    body = (
      <>
        <Text style={styles.heading}>%%backCamera%%</Text>
        <CameraPreview device={device} onCameraReady={() => setCameraReady(true)} onMountError={() => setCameraFailed(true)} />
        <Text>{cameraReady ? '%%ready%%' : '%%starting%%'}</Text>
      </>
    );
  } else if (answer.canAskAgain) body = <><Text>%%rationale%%</Text><Button label="%%askAgain%%" onPress={ask} />{skip}</>;
  else body = <><Text>%%blocked%%</Text><Button label="%%openSettings%%" onPress={() => device.openSettings()} />{skip}</>;

  return <View style={styles.card}>{body}</View>;
}

const styles = StyleSheet.create({
  card: { padding: 12, gap: 10 },
  heading: { fontSize: 18, fontWeight: '700' },
  button: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1d4ed8', borderRadius: 6 },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});
