// build.js (read-only): the build card of the expense tracker's CP-RN release build
// and the target declared for the checkpoint. Synthetic values.
export const declaredTarget = { kind: 'android-emulator', name: 'Pixel 9', os: 'Android 16 (API 36)' };

// The browser preview of this course, as a target. It runs react-native-web, not a native app.
export const previewTarget = { kind: 'browser-preview', name: 'react-native-web', os: 'Chrome' };

export const iosSimulator = { kind: 'ios-simulator', name: 'iPhone 17', os: 'iOS 26' };

export const build = {
  id: 'a41c9e2', // the commit the release build was made from
  version: '1.1.0 (3)', // versionName (versionCode)
  fingerprint: 'SHA-256 74:BD:C0:40:62:16:2B:46:7E:6B:CD:0F:EB:F9:E8:C7:FD:62:CE:2D:F8:77:0A:88:D0:F2:C2:3A:84:31:20:C5',
};
