// SIMULATION for the preview only (read-only). It stands in for the tools that read an artifact back —
// `aapt2 dump badging` / `adb shell dumpsys package` on Android, `plutil -p` on iOS — but it only
// pulls a few fields out of the supplied text excerpts with regular expressions.
import { androidGradle, androidManifest, iosBuildSettings, iosInfoPlist } from './supplied-artifacts.js';

function plistString(key) {
  const match = new RegExp(`<key>${key}</key>\\s*<string>([^<]*)</string>`).exec(iosInfoPlist);
  if (!match) return null;
  return match[1].replace(/\$\((\w+)\)/g, (whole, name) => iosBuildSettings[name] ?? whole);
}

export function readAndroid() {
  return {
    platform: 'android',
    id: /applicationId '([^']+)'/.exec(androidGradle)[1],
    version: /versionName "([^"]+)"/.exec(androidGradle)[1],
    build: /versionCode (\d+)/.exec(androidGradle)[1],
    permissions: [...androidManifest.matchAll(/<uses-permission android:name="([^"]+)"/g)].map((m) => m[1]),
  };
}

export function readIos() {
  return {
    platform: 'ios',
    id: plistString('CFBundleIdentifier'),
    version: plistString('CFBundleShortVersionString'),
    build: plistString('CFBundleVersion'),
    // iOS has no permission list: each protected resource needs an NS…UsageDescription key.
    permissions: [...iosInfoPlist.matchAll(/<key>(NS\w+UsageDescription)<\/key>/g)].map((m) => m[1]),
  };
}
