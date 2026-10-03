// app.config.js: a lab stand-in for the values a release build reads. The photo service's key is synthetic.
// In a real Expo project `env` is the .env file (EXPO_PUBLIC_ variables), `ios.infoPlist` is the app config field
// of the same name, and `android.buildConfigFields` stands in for a Gradle buildConfigField (set in
// android/app/build.gradle or by a config plugin): Expo's app config has no such key.
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
