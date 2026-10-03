// Misconception: "reinstalling the old build fixes the data" — migrated data is missing from the list.
export const note = {
  compatibility: {
    minAndroidApi: 26,
    minIos: '16.4',
    schemaWritten: 3,
    leftBehindAndroidApis: [24, 25],
  },
  ifBroken: {
    action: 'forward-fix',
    nextVersionCode: 8,
  },
  cannotUndo: ['installed-builds', 'used-version-code', 'store-listing-text'],
};
