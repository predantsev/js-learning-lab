// Misconception: "the version people see decides what is newer" — only the version changed.
export const first = {
  version: '1.0.0',
  android: { package: 'com.example.jsll.planner', versionCode: 1 },
  ios: { bundleIdentifier: 'com.example.jsll.planner', buildNumber: '1' },
};

export const second = {
  version: '1.1.0',
  android: { package: 'com.example.jsll.planner', versionCode: 1 },
  ios: { bundleIdentifier: 'com.example.jsll.planner', buildNumber: '1' },
};

export const rules = {
  version: 'Goes up with every release.',
  androidPackage: 'Never changes.',
  versionCode: 'Stays as it is.',
  iosBundleIdentifier: 'Never changes.',
  buildNumber: 'Stays as it is.',
};
