// Switch reminders off with the remote flag at once, then ship the fix as build 8.
const api = (from, to) => Array.from({ length: to - from }, (_, i) => from + i);

export const note = {
  compatibility: {
    minAndroidApi: 26,
    minIos: '16.4',
    schemaWritten: 3,
    leftBehindAndroidApis: api(24, 26),
  },
  ifBroken: {
    action: 'kill-switch',
    nextVersionCode: 8,
  },
  cannotUndo: ['used-version-code', 'migrated-data', 'installed-builds'],
};
