// build.js: the build and the target the CP-RN records are about. The reference was prepared on a
// computer without a native target and without an Android SDK: no release APK was built, so there is no
// signer fingerprint to read. Your file names your declared target and your release build.
export const declaredTarget = { kind: 'none', name: 'no emulator, simulator or phone on the reference computer', os: 'macOS (computer only)' };

export const otherPlatform = { kind: 'ios-simulator', name: 'iPhone simulator', os: 'iOS (needs Xcode)' };

export const build = {
  id: 'the commit of the CP-RN enhancement',
  version: '1.0.1 (2)', // versionName (versionCode) of the RN-11 release
  fingerprint: 'not read: no release APK was built on the reference computer',
};
