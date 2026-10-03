// app.config.js: what the build reads. The photo service's key is synthetic.
export const config = {
  env: {
    EXPO_PUBLIC_API_URL: 'https://photos.lab.example',
    EXPO_PUBLIC_PHOTO_SECRET: 'sk_lab_4f9e2b7c',
  },
  ios: {
    infoPlist: { CFBundleDisplayName: 'Lab' },
  },
  android: {
    buildConfigFields: { APP_FLAVOR: 'lab' },
  },
};
