// The raised minimum Android version is noted, but nobody is listed as left behind.
export const note = {
  compatibility: {
    minAndroidApi: 26,
    minIos: '16.4',
    schemaWritten: 3,
    leftBehindAndroidApis: [],
  },
  ifBroken: {
    action: 'forward-fix',
    nextVersionCode: 8,
  },
  cannotUndo: ['installed-builds', 'migrated-data', 'used-version-code'],
};
