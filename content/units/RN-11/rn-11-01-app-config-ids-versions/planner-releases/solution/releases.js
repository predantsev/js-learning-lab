// The planner's first two releases, in the shape of the "expo" part of app.json.
// Builds 1 and 2 went to testers, so the first release is build 3; the second only fixes a bug.
export const first = {
  version: '1.0.0',
  android: { package: 'com.example.jsll.planner', versionCode: 3 },
  ios: { bundleIdentifier: 'com.example.jsll.planner', buildNumber: '3' },
};

export const second = {
  version: '1.0.1',
  android: { package: 'com.example.jsll.planner', versionCode: 4 },
  ios: { bundleIdentifier: 'com.example.jsll.planner', buildNumber: '4' },
};

// One line per field: what may happen to it from one release to the next.
export const rules = {
  version: 'Shown to users; raised by semver for every release (App Store Connect compares it, the OS does not).',
  androidPackage: 'The app identity on Android; never change it after the first install.',
  versionCode: 'A whole number; every build sent to the store gets a higher one.',
  iosBundleIdentifier: 'The app identity on iOS; never change it after the first install.',
  buildNumber: 'Digits as text; every build sent to the store gets a higher one.',
};
