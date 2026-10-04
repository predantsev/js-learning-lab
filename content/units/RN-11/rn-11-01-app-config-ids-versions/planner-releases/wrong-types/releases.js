// The numbers go up, but the types are swapped: versionCode as text, buildNumber as a number.
export const first = {
  version: '1.0.0',
  android: { package: 'com.example.jsll.planner', versionCode: '3' },
  ios: { bundleIdentifier: 'com.example.jsll.planner', buildNumber: 3 },
};

export const second = {
  version: '1.0.1',
  android: { package: 'com.example.jsll.planner', versionCode: '4' },
  ios: { bundleIdentifier: 'com.example.jsll.planner', buildNumber: 4 },
};

export const rules = {
  version: 'Goes up with every release.',
  androidPackage: 'Never changes.',
  versionCode: 'Goes up.',
  iosBundleIdentifier: 'Never changes.',
  buildNumber: 'Goes up.',
};
