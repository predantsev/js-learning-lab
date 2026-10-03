// Without the plugin entry, prebuild still applies expo-camera with its default text.
export const appJson = {
  expo: {
    name: 'rn07-lab',
    ios: { supportsTablet: true, bundleIdentifier: 'com.example.rn07lab' },
    android: { package: 'com.example.rn07lab', blockedPermissions: [] },
  },
};
