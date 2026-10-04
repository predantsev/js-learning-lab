// Misconception: "the first release starts the count at 1" — the testers' builds 1 and 2 are forgotten.
export const first = {
  version: '1.0.0',
  android: { package: 'com.example.jsll.planner', versionCode: 1 },
  ios: { bundleIdentifier: 'com.example.jsll.planner', buildNumber: '1' },
};

export const second = {
  version: '1.0.1',
  android: { package: 'com.example.jsll.planner', versionCode: 2 },
  ios: { bundleIdentifier: 'com.example.jsll.planner', buildNumber: '2' },
};

export const rules = {
  version: 'Shown to users; raised by semver for every release.',
  androidPackage: 'The app identity on Android; never change it after the first install.',
  versionCode: 'A whole number; every build sent to the store gets a higher one.',
  iosBundleIdentifier: 'The app identity on iOS; never change it after the first install.',
  buildNumber: 'Digits as text; every build sent to the store gets a higher one.',
};
