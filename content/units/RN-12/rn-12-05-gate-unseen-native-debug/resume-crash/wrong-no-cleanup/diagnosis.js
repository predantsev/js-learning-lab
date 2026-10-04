// diagnosis.js: your diagnosis of the two failures.
//
// Causes to choose from:
//   'version-mismatch'      — the installed version is not the one the SDK expects
//   'removed-export'        — the code imports something the new package version no longer has
//   'promise-used-as-value' — the code uses a Promise as if it were the value it resolves to
//   'null-native-argument'  — native code got null where it needs a value
//   'missing-permission'    — the platform refused a capability
export const diagnosis = {
  buildLine: 9, //   the number of the line in build-log.txt with the first real error
  buildCause: 'removed-export', // why the bundling failed
  crashLine: 7, //   the number of the first line in crash-report.txt that names the crash's error
  crashCause: 'promise-used-as-value', // why the app closes on return
};
