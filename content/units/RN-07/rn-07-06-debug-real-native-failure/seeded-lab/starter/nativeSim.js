// SIMULATION (read-only) of the native toolchain for the RN-07 lab. What it reproduces was checked
// on a real Expo SDK 57 project: the version check's text, what `npx expo prebuild` writes into
// Info.plist and AndroidManifest.xml for a given app.json, and the message expo-camera 57 raises
// when NSCameraUsageDescription is missing (from its source, CameraPermissionsRequester.swift).
// What happens after that message comes from React Native 0.86's source (RCTAssert.m): a debug
// build shows it on the red screen, a release build closes. The Android outcome is an expectation:
// expo-modules-core hands the request to Android, and without CAMERA in the manifest we expect
// a refusal with no dialog — not checked on a device.
// The build and the device are NOT real: no Gradle, no Xcode, no phone.
const SDK_57 = { 'expo-camera': '57.0.6' };
const DEFAULT_CAMERA_TEXT = 'Allow $(PRODUCT_NAME) to access your camera';

const major = (range) => String(range ?? '').replace(/^[~^]/, '').split('.')[0];

// The build: the simulation first runs the same check as `npx expo install --check`.
export function build(dependencies) {
  const wrong = Object.entries(SDK_57).filter(([name, expected]) => major(dependencies?.[name]) !== major(expected));
  if (wrong.length === 0) return { ok: true, log: ['BUILD SUCCESSFUL (simulated)'] };
  return {
    ok: false,
    log: [
      'The following packages should be updated for best compatibility with the installed expo version:',
      ...wrong.map(([name, expected]) => `  ${name}@${String(dependencies[name]).replace(/^[~^]/, '')} - expected version: ~${expected}`),
      'BUILD FAILED (simulated: a native module from another SDK)',
    ],
  };
}

// What prebuild generates from app.json (checked against the real prebuild output).
export function prebuild(appJson) {
  const expo = appJson?.expo ?? {};
  const camera = (expo.plugins ?? []).find((plugin) => (Array.isArray(plugin) ? plugin[0] : plugin) === 'expo-camera');
  const options = Array.isArray(camera) ? camera[1] ?? {} : {};
  const infoPlist = {};
  if (options.cameraPermission !== false) infoPlist.NSCameraUsageDescription = options.cameraPermission || DEFAULT_CAMERA_TEXT;
  const blocked = expo.android?.blockedPermissions ?? [];
  return { infoPlist, androidCamera: !blocked.includes('android.permission.CAMERA') };
}

// Opening the capture screen, which asks for the camera permission status.
export function openCapture(platform, native) {
  if (platform === 'ios') {
    if (!native.infoPlist.NSCameraUsageDescription) {
      return {
        crashed: true,
        log: [
          'capture: permission loading',
          'This app is missing NSCameraUsageDescription,',
          "so video services will fail. Add this entry to your bundle's Info.plist.",
          '(simulated) debug build: the red screen shows this message; a release build closes the app',
        ],
      };
    }
    return { crashed: false, log: ['capture: permission undetermined', '(simulated) the camera dialog can be shown'] };
  }
  if (!native.androidCamera) {
    return { crashed: false, denied: true, log: ['capture: permission denied', '(simulated, expected, not verified) no dialog: CAMERA is not in the merged manifest'] };
  }
  return { crashed: false, log: ['capture: permission undetermined', '(simulated) the camera dialog can be shown'] };
}
