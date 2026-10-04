// The second release copies the first and changes only what must change.
const id = 'com.example.jsll.planner';

export const first = {
  version: '1.0.0',
  android: { package: id, versionCode: 3 },
  ios: { bundleIdentifier: id, buildNumber: '3' },
};

export const second = {
  ...first,
  version: '1.0.1',
  android: { ...first.android, versionCode: first.android.versionCode + 1 },
  ios: { ...first.ios, buildNumber: String(Number(first.ios.buildNumber) + 1) },
};

export const rules = {
  version: 'What people see; goes up with every release.',
  androidPackage: 'Fixed forever: a new value is a new app.',
  versionCode: 'An integer that only goes up.',
  iosBundleIdentifier: 'Fixed forever: a new value is a new app.',
  buildNumber: 'A numeric string that only goes up.',
};
