// diagnosis.js: your diagnosis of the two failures.
//
// Causes to choose from:
//   'version-mismatch'      — the installed version is not the one the SDK expects
//   'removed-export'        — the code imports something the new package version no longer has
//   'promise-used-as-value' — the code uses a Promise as if it were the value it resolves to
//   'null-native-argument'  — native code got null where it needs a value
//   'missing-permission'    — the platform refused a capability
export const diagnosis = {
  buildLine: 0, //   the number of the line in build-log.txt with the first real error
  buildCause: '', // why the bundling failed
  crashLine: 0, //   the number of the first line in crash-report.txt that names the crash's error
  crashCause: '', // why the app closes on return
};
