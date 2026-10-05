// The iOS declaration is back, but Android still blocks the camera.
export const appJson = {
  expo: {
    name: 'rn07-lab',
    ios: { supportsTablet: true, bundleIdentifier: 'com.example.rn07lab' },
    android: {
      package: 'com.example.rn07lab',
      blockedPermissions: ['android.permission.CAMERA'],
    },
    plugins: [['expo-camera', { cameraPermission: '%%cameraText%%' }]],
  },
};
