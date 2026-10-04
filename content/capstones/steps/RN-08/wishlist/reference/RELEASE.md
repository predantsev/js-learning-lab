# Wishlist — release notes

## Ids and versions

| `app.json` | Value | Android (`android/app/build.gradle`) | iOS (generated project) |
|---|---|---|---|
| `android.package` / `ios.bundleIdentifier` | `com.example.jsll.wishlist` | `applicationId 'com.example.jsll.wishlist'` | `PRODUCT_BUNDLE_IDENTIFIER = "com.example.jsll.wishlist"` |
| `version` | `1.0.0` (build 1), `1.0.1` (build 2) | `versionName` | `CFBundleShortVersionString` |
| `android.versionCode` / `ios.buildNumber` | `1` / `"1"`, then `2` / `"2"` | `versionCode` | `CFBundleVersion` |

The id never changes after the first install: another id would be another app next to this one.

## Signing and key hygiene

- Key location: a PKCS12 keystore outside the project (`~/keys/wishlist-upload.keystore`), made with
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
`build.gradle` has `applicationId 'com.example.jsll.wishlist'`, `versionCode 1` / `versionName "1.0.0"`
(then 2 / "1.0.1") and `signingConfig signingConfigs.release` in the release build type.
`npx expo export --platform android --output-dir release-check`, then `grep -c -a -F` in the `.hbc`
bundle: `MYAPP_UPLOAD` 0, `keystore` 0, `jsll.wishlist.v1` 1 (the app's own code is there), `10.0.2.2` 1 — the
mock service's development address; in a release build its screen is not reachable (the button exists
only under `__DEV__`) and plain `http://` is not allowed anyway.

On the target (not performed — no emulator, simulator or phone on the computer where this was prepared):
`npx expo run:android --variant release`, `adb shell dumpsys package com.example.jsll.wishlist | grep -E
"versionCode|versionName"`, `apksigner verify --print-certs` (its SHA-256 equals the keytool fingerprint),
the APK size, `unzip -l … | grep keystore` — nothing. Revisit: run them and write the results here.

## Smoke checklist

First start, restart, update over the previous build, dev server stopped: the six starting wishes and “still wanted, total” 365 after a first start; a wish marked acquired survives a restart and the update to build 2.
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

Build 1 cannot simply be installed again over build 2. Android compares versionCode: 1 is lower than
2, so a plain install refuses it as a downgrade (a code like `INSTALL_FAILED_VERSION_DOWNGRADE` is
expected; not seen here). Uninstalling first does install build 1 — and deletes the saved wishes with the
app's storage. So "going back" means a forward fix: build 3 (versionCode 3, version 1.0.2) with the old
code, the same id and the same upload key, installed over build 2; the saved wishes stay.

## The other platform

From the generated files (`npx expo prebuild --platform ios --no-install`): the same id
`com.example.jsll.wishlist`, `CFBundleShortVersionString` 1.0.1, `CFBundleVersion` 2. A simulator build
(`npx expo run:ios --configuration Release`) needs Xcode on macOS and has no distribution signature; an
IPA for a phone needs an Apple Developer account and its signing — not done in this course. The Android
release signing of the plugin does not apply to iOS.
