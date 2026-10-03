// Misconception: "rolling back means giving people build 6 again".
export const note = {
  compatibility: {
    minAndroidApi: 26,
    minIos: '16.4',
    schemaWritten: 3,
    leftBehindAndroidApis: [24, 25],
  },
  ifBroken: {
    action: 'reinstall-previous',
    nextVersionCode: 6,
  },
  cannotUndo: ['installed-builds', 'migrated-data', 'used-version-code'],
};
