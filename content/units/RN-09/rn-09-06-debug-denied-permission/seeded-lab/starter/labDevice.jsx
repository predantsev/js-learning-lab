// labDevice.jsx: a simulated phone for this preview only — the camera permission and the camera itself. Do not edit.
// The permission follows the documented Android rule (no dialog after a second denial).
// CameraPreview imitates expo-camera's CameraView: onCameraReady when the camera starts,
// onMountError when "the camera preview could not start". Firing it both with no camera and with no permission is
// this lab's model; what a real CameraView does in each case is checked on your target.
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

export function createLabDevice({ hasCamera }) {
  let status = 'undetermined';
  let canAskAgain = true;
  let denials = 0;
  let dialogsShown = 0;
  let pendingDialog = null;
  const listeners = new Set();
  const snapshot = () => ({ status, granted: status === 'granted', canAskAgain });
  const notify = () => listeners.forEach((listener) => listener());

  return {
    hasCamera,
    async getPermission() {
      return snapshot();
    },
    requestPermission() {
      if (status === 'granted' || !canAskAgain) return Promise.resolve(snapshot());
      dialogsShown += 1;
      return new Promise((resolve) => {
        pendingDialog = (allow) => {
          pendingDialog = null;
          if (allow) status = 'granted';
          else {
            status = 'denied';
            denials += 1;
            canAskAgain = denials < 2;
          }
          notify();
          resolve(snapshot());
        };
        notify();
      });
    },
    openSettings() {
      notify();
    },
    panel: {
      info: () => ({ ...snapshot(), dialogsShown, dialogOpen: pendingDialog !== null, hasCamera }),
      answerDialog: (allow) => pendingDialog?.(allow),
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
  };
}

export function CameraPreview({ device, onCameraReady, onMountError }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const { granted } = device.panel.info();
      if (device.hasCamera && granted) onCameraReady?.();
      else onMountError?.({ message: granted ? 'Camera preview could not start: no camera on this device' : 'Camera preview could not start: no camera permission' });
    }, 30);
    return () => clearTimeout(timer);
  }, [device]);
  return <View accessibilityLabel="camera preview" style={styles.preview} />;
}

const styles = StyleSheet.create({
  preview: { height: 120, backgroundColor: '#111827', borderRadius: 8 },
});
