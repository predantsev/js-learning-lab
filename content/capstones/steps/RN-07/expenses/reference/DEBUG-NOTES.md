# Debug notes — a local failure of this project

## The failure (seeded on purpose, then repaired)

`npm install react-native-gesture-handler@2.30.0` put a version next to the one Expo SDK 57 expects.

First decisive line of `npx expo install --check`:

    react-native-gesture-handler@2.30.0 - expected version: ~2.32.0

Part that broke: the dependencies (a version pin), not the code: `npx tsc --noEmit` and `npm test`
still passed. The bundle did not: `npx expo export --platform android` (and `--platform ios`) stopped with

    Error: Unable to resolve module react-native/Libraries/Renderer/shims/ReactNative from node_modules/react-native-gesture-handler/src/RNRenderer.ts

The older package asks for a file that this version of React Native does not have (measured with Node.js
25.2.1 and Expo SDK 57). Metro bundles the app for the target with the same resolver, so the target is
expected to show the same error at start; that was not checked on a device.

## The repair (the documented way)

`npx expo install --fix`, then `npx expo install --check` — `Dependencies are up to date`.
`grep react-native-gesture-handler package.json` after the repair: `"react-native-gesture-handler": "~2.32.0"` again.

## On the target

Not performed: no emulator, simulator or phone on the computer where this reference was prepared.
Revisit: with the wrong version installed, start the app on the declared target and write down the
first line of the device log (`adb logcat "*:S" ReactNative:V ReactNativeJS:V`) or of Metro that names
the module, before the repair; then confirm the repaired app starts.
