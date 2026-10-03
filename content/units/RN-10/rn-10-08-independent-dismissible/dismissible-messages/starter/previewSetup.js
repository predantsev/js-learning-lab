// Preview-only setup (read-only). React Native provides a global object named `global`; the
// react-native-web build in this preview looks for it when an animation is stopped or replaced.
// On a phone this line is not needed.
globalThis.global ??= globalThis;
