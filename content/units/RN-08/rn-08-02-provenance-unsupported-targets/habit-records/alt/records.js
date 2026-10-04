// records.js: two CP-RN records of the habit tracker's seven-day grid.
// Values copied from build.js instead of imported, written in a different order.

// 1. The lifecycle check, performed on the declared target with the release build.
export const lifecycleRecord = {
  provenance: 'learner-authored',
  check: 'lifecycle',
  procedure: '%%lifecycleProcedure%%',
  observed: '%%lifecycleObserved%%',
  outcome: 'pass',
  target: { kind: 'android-emulator', name: 'Medium Phone', os: 'Android 16 (API 36)' },
  build: {
    id: 'c07d5e1',
    version: '2.0.0 (7)',
    fingerprint: 'SHA-256 5C:3E:E5:AB:7A:65:FA:FC:5D:F5:97:EA:87:64:81:3C:A6:59:78:56:79:66:BB:67:FC:6E:99:87:03:AF:CF:70',
  },
};

// 2. The offline check on the iOS simulator, which this Windows computer cannot run.
export const iosSkip = {
  provenance: 'skipped',
  check: 'offline',
  target: { kind: 'ios-simulator', name: 'iPhone 17', os: 'iOS 26' },
  reason: '%%iosReason%%',
  revisit: '%%iosRevisit%%',
};
