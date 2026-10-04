// build.js (read-only): the expense tracker's release build for this gate, the debug build of the same
// commit, and the targets. Synthetic values.
export const declaredTarget = { kind: 'android-emulator', name: 'Pixel 9', os: 'Android 16 (API 36)' };
export const iosSimulator = { kind: 'ios-simulator', name: 'iPhone 17', os: 'iOS 26' };

export const build = {
  id: 'c7d21f0', // the commit the release build was made from
  version: '1.4.0 (6)', // versionName (versionCode)
  fingerprint: 'SHA-256 3A:9F:11:C4:52:E0:7B:88:0D:6E:A1:F3:24:B9:5C:70:DE:13:8A:46:F2:09:B7:65:C1:3E:84:2D:90:5F:AB:17',
};

export const debugBuild = {
  id: 'c7d21f0',
  version: '1.4.0 (6)',
  fingerprint: 'SHA-256 0B:62:E8:4D:93:1F:A7:3C:58:D0:26:9E:71:B4:0A:C5:3F:E2:86:19:D7:4B:A0:6C:E3:58:12:F9:2D:7A:C1:84',
};
