// ProgressPhoto.jsx: "take a progress photo" for a habit check-in. Users report a crash and an endless spinner.
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
  const [step, setStep] = useState('start');
  const [lens, setLens] = useState(undefined);
  const [cameraReady, setCameraReady] = useState(false);

  async function takePhoto() {
    const result = await device.requestPermission();
    setLens(result.granted ? { label: '%%backCamera%%' } : undefined);
    setStep('camera');
  }

  if (step === 'saved') return <Text style={styles.note}>%%savedWithout%%</Text>;

  if (step === 'camera') {
    return (
      <View style={styles.card}>
        <Text style={styles.heading}>{lens.label}</Text>
        <CameraPreview device={device} onCameraReady={() => setCameraReady(true)} />
        <Text>{cameraReady ? '%%ready%%' : '%%starting%%'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>%%habit%%</Text>
      <Button label="%%takePhoto%%" onPress={takePhoto} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, gap: 10 },
  heading: { fontSize: 18, fontWeight: '700' },
  note: { padding: 12 },
  button: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1d4ed8', borderRadius: 6 },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});
