// The planner's first two releases, in the shape of the "expo" part of app.json.
// Replace every null and fill in the rules.
export const first = {
  version: null,
  android: { package: null, versionCode: null },
  ios: { bundleIdentifier: null, buildNumber: null },
};

export const second = {
  version: null,
  android: { package: null, versionCode: null },
  ios: { bundleIdentifier: null, buildNumber: null },
};

// One line per field: what may happen to it from one release to the next.
export const rules = {
  version: '',
  androidPackage: '',
  versionCode: '',
  iosBundleIdentifier: '',
  buildNumber: '',
};
