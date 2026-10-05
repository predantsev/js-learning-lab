// The release and rollback note for build 7 of the habit tracker. Fill in every value.
export const note = {
  compatibility: {
    minAndroidApi: null,
    minIos: null,
    schemaWritten: null,
    leftBehindAndroidApis: [], // Android API levels that can no longer install the update
  },
  ifBroken: {
    action: null, // 'forward-fix' | 'kill-switch' | 'reinstall-previous'
    nextVersionCode: null,
  },
  cannotUndo: [], // words from UNDO_WORDS
};
