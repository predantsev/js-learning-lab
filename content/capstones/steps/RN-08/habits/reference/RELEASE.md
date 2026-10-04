# Habit tracker — release notes

## Ids and versions

| `app.json` | Value | Android (`android/app/build.gradle`) | iOS (generated project) |
|---|---|---|---|
| `android.package` / `ios.bundleIdentifier` | `com.example.jsll.habits` | `applicationId 'com.example.jsll.habits'` | `PRODUCT_BUNDLE_IDENTIFIER = "com.example.jsll.habits"` |
| `version` | `1.0.0` (build 1), `1.0.1` (build 2) | `versionName` | `CFBundleShortVersionString` |
| `android.versionCode` / `ios.buildNumber` | `1` / `"1"`, then `2` / `"2"` | `versionCode` | `CFBundleVersion` |

The id never changes after the first install: another id would be another app next to this one.

## Signing and key hygiene

- Key location: a PKCS12 keystore outside the project (`~/keys/habits-upload.keystore`), made with
  `keytool -genkeypair -v -storetype PKCS12 …`; its SHA-256 fingerprint is written down from `keytool -list`.
- Passwords: only in `~/.gradle/gradle.properties` (`MYAPP_UPLOAD_STORE_FILE`, `MYAPP_UPLOAD_KEY_ALIAS`,
  `MYAPP_UPLOAD_STORE_PASSWORD`, `MYAPP_UPLOAD_KEY_PASSWORD`), outside the repository.
- In the repository: `plugins/with-release-signing.js` and its line in `app.json` — property names only.
  `.gitignore` ignores `*.keystore`, `*.jks` and the generated `/android` and `/ios`.
- Backup: a second copy of the keystore and the passwords in another place than the key itself.
- If it leaks: a new upload key; people who installed the APK directly have no update path signed by the
  old key any more.

## Artifact evidence (build 1 and build 2)

On the computer (done): `npx expo prebuild --platform android --no-install` — `✔ Finished prebuild`;
`build.gradle` has `applicationId 'com.example.jsll.habits'`, `versionCode 1` / `versionName "1.0.0"`
(then 2 / "1.0.1") and `signingConfig signingConfigs.release` in the release build type.
`npx expo export --platform android --output-dir release-check`, then `grep -c -a -F` in the `.hbc`
bundle: `MYAPP_UPLOAD` 0, `keystore` 0, `jsll.habits.v1` 1 (the app's own code is there), `10.0.2.2` 1 — the
mock service's development address; in a release build its screen is not reachable (the button exists
only under `__DEV__`) and plain `http://` is not allowed anyway.

On the target (not performed — no emulator, simulator or phone on the computer where this was prepared):
`npx expo run:android --variant release`, `adb shell dumpsys package com.example.jsll.habits | grep -E
"versionCode|versionName"`, `apksigner verify --print-certs` (its SHA-256 equals the keytool fingerprint),
the APK size, `unzip -l … | grep keystore` — nothing. Revisit: run them and write the results here.

## Smoke checklist

First start, restart, update over the previous build, dev server stopped: build 1: mark a habit for today; install build 2 over it — the completions and the streak are still there.
Not performed here (no target).

## Privacy declaration

| Data | Collected (leaves the device) | Where |
|---|---|---|
| the records of the list | no | on the device only (AsyncStorage) |
| the records of the mock service screen | no | read from a development service, development builds only |

## Update path

Sideloading: a new signed APK with a higher versionCode, installed over the old one. The app has no
`expo-updates`, so every change — code, assets, a native module such as gesture handling or storage, a
permission, the icon — ships as a new build.

## Rollback limits

Builds 1 and 2 both write snapshot version 1, so going from 2 to a forward fix keeps every completion.
The limit is a schema change: if build 2 had migrated the snapshot to version 2, the code of build 1 would
see a "newer" snapshot and — as `loadSnapshot` does with anything it cannot restore — set it aside under
`jsll.habits.v1.backup` and show the starting habits. Old code cannot read migrated data, and versionCode
2 cannot be taken back. So a schema change ships only with a forward-compatible plan: migrations add
fields instead of renaming them, and a bad build is replaced by build 3 that still reads version 2.

## The other platform

From the generated files (`npx expo prebuild --platform ios --no-install`): the same id
`com.example.jsll.habits`, `CFBundleShortVersionString` 1.0.1, `CFBundleVersion` 2. A simulator build
(`npx expo run:ios --configuration Release`) needs Xcode on macOS and has no distribution signature; an
IPA for a phone needs an Apple Developer account and its signing — not done in this course. The Android
release signing of the plugin does not apply to iOS.
