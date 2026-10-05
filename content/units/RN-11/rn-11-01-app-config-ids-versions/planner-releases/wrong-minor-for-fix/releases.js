// Misconception: "every release raises MINOR" — but this one only fixes a bug.
export const first = {
  version: '1.0.0',
  android: { package: 'com.example.jsll.planner', versionCode: 3 },
  ios: { bundleIdentifier: 'com.example.jsll.planner', buildNumber: '3' },
};

export const second = {
  version: '1.1.0',
  android: { package: 'com.example.jsll.planner', versionCode: 4 },
  ios: { bundleIdentifier: 'com.example.jsll.planner', buildNumber: '4' },
};

export const rules = {
  version: 'Shown to users; raised by semver for every release.',
  androidPackage: 'The app identity on Android; never change it after the first install.',
  versionCode: 'A whole number; every build sent to the store gets a higher one.',
  iosBundleIdentifier: 'The app identity on iOS; never change it after the first install.',
  buildNumber: 'Digits as text; every build sent to the store gets a higher one.',
};
