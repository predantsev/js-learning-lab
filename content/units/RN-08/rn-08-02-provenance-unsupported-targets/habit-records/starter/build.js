// build.js (read-only): the build cards of the habit tracker's CP-RN enhancement
// and the target declared for the checkpoint. Synthetic values.
export const declaredTarget = { kind: 'android-emulator', name: 'Medium Phone', os: 'Android 16 (API 36)' };

export const iosSimulator = { kind: 'ios-simulator', name: 'iPhone 17', os: 'iOS 26' };

// The release build: the one the checkpoint is about.
export const build = {
  id: 'c07d5e1', // the commit the build was made from
  version: '2.0.0 (7)', // versionName (versionCode)
  fingerprint: 'SHA-256 5C:3E:E5:AB:7A:65:FA:FC:5D:F5:97:EA:87:64:81:3C:A6:59:78:56:79:66:BB:67:FC:6E:99:87:03:AF:CF:70',
};

// The debug build of the same commit: signed with the debug key, so its fingerprint differs.
export const debugBuild = {
  id: 'c07d5e1',
  version: '2.0.0 (7)',
  fingerprint: 'SHA-256 FA:C4:0E:91:3B:58:D2:6A:07:1F:C8:A3:55:9E:24:B0:6D:81:F3:47:2C:E9:15:7A:BE:03:94:D6:68:2F:A1:5B',
};
