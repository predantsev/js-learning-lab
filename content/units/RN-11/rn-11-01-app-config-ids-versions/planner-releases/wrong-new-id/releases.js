// Misconception: "changing the package id is a harmless rename".
export const first = {
  version: '1.0.0',
  android: { package: 'com.example.jsll.planner', versionCode: 3 },
  ios: { bundleIdentifier: 'com.example.jsll.planner', buildNumber: '3' },
};

export const second = {
  version: '1.0.1',
  android: { package: 'com.example.jsll.planner2', versionCode: 4 },
  ios: { bundleIdentifier: 'com.example.jsll.planner2', buildNumber: '4' },
};

export const rules = {
  version: 'Goes up with every release.',
  androidPackage: 'Can be renamed when the app gets a new name.',
  versionCode: 'Goes up.',
  iosBundleIdentifier: 'Can be renamed when the app gets a new name.',
  buildNumber: 'Goes up.',
};
