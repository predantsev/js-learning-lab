// SUPPLIED (read-only): a synthetic update of the habit tracker, and what went wrong after it shipped.
export const previous = { versionCode: 6, version: '1.4.0', minAndroidApi: 24, minIos: '16.4', schemaVersion: 2 };

export const update = {
  versionCode: 7,
  version: '1.5.0',
  minAndroidApi: 26, // a new library needs Android 8.0
  minIos: '16.4',
  schemaVersion: 3, // the v2 → v3 migration adds `reminderTime` to every habit and keeps every v2 field
  remoteFlags: ['reminders'], // build 7 reads this flag from the mock service and hides reminders when it is off
};

export const incident = '%%incidentText%%';

// The words the note may use for things that cannot be undone after build 7 shipped.
export const UNDO_WORDS = ['installed-builds', 'migrated-data', 'used-version-code', 'store-listing-text', 'app-icon'];
