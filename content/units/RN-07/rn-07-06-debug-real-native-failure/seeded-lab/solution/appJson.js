// The lab's app.json, as JavaScript (only the parts that matter here).
export const appJson = {
  expo: {
    name: 'rn07-lab',
    ios: { supportsTablet: true, bundleIdentifier: 'com.example.rn07lab' },
    android: {
      package: 'com.example.rn07lab',
    },
    plugins: [['expo-camera', { cameraPermission: '%%cameraText%%' }]],
  },
};
