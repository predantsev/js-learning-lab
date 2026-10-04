// A jump in the build numbers is fine: they only have to go up.
export const first = {
  version: '1.0.0',
  android: { package: 'com.example.jsll.planner', versionCode: 3 },
  ios: { bundleIdentifier: 'com.example.jsll.planner', buildNumber: '3' },
};

export const second = {
  version: '1.0.1',
  android: { package: 'com.example.jsll.planner', versionCode: 10 },
  ios: { bundleIdentifier: 'com.example.jsll.planner', buildNumber: '10' },
};

export const rules = {
  version: 'Visible to people, bumped per release (semver).',
  androidPackage: 'Never changes.',
  versionCode: 'Must be greater than any versionCode shipped before.',
  iosBundleIdentifier: 'Never changes.',
  buildNumber: 'Must be greater than any build uploaded before.',
};
