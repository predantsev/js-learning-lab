// Your own release, as you read it back from the artifact in the build-artifacts lesson.
// This example is an Android build; the viewer compares it with the iOS artifact you cannot build.
export const myBuild = {
  platform: 'android',
  id: 'com.example.jsll.releaselab',
  version: '1.0.0',
  build: '1',
  permissions: [
    'android.permission.INTERNET',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.SYSTEM_ALERT_WINDOW',
    'android.permission.VIBRATE',
    'android.permission.WRITE_EXTERNAL_STORAGE',
  ],
};
