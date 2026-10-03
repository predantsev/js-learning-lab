// The planner's first two releases, in the shape of the "expo" part of app.json.
export const first = {
  version: '1.0.0',
  android: { package: 'com.example.jsll.planner', versionCode: 1 },
  ios: { bundleIdentifier: 'com.example.jsll.planner', buildNumber: '1' },
};

export const second = {
  version: '1.1.0',
  android: { package: 'com.example.jsll.planner', versionCode: 2 },
  ios: { bundleIdentifier: 'com.example.jsll.planner', buildNumber: '2' },
};

// One line per field: what may happen to it from one release to the next.
export const rules = {
  version: 'Shown to users; raise it by semver for every release, the OS never compares it.',
  androidPackage: 'The app identity on Android; never change it after the first install.',
  versionCode: 'A whole number; every release gets a higher one, or the store refuses it.',
  iosBundleIdentifier: 'The app identity on iOS; never change it after the first install.',
  buildNumber: 'Digits as text; every build sent to the store gets a higher one.',
};
