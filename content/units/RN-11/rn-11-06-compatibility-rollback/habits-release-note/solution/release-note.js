// The release and rollback note for build 7 of the habit tracker.
export const note = {
  compatibility: {
    minAndroidApi: 26,
    minIos: '16.4',
    schemaWritten: 3,
    leftBehindAndroidApis: [24, 25], // they stay on build 6 for good
  },
  ifBroken: {
    action: 'forward-fix', // build 8 with the crash fixed; versionCode never goes back
    nextVersionCode: 8,
  },
  cannotUndo: ['installed-builds', 'migrated-data', 'used-version-code'],
};
