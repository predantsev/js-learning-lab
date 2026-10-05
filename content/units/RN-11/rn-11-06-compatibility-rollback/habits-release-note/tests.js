import { note } from './release-note.js';
import { UNDO_WORDS } from './update.js';

test('the compatibility window matches build 7', () => {
  expect(note.compatibility.minAndroidApi, 'compatibility.minAndroidApi').toBe(26);
  expect(String(note.compatibility.minIos), 'compatibility.minIos').toBe('16.4');
  expect(note.compatibility.schemaWritten, 'compatibility.schemaWritten').toBe(3);
});

test('the Android versions left on build 6 are named', () => {
  const apis = [...note.compatibility.leftBehindAndroidApis].sort((a, b) => a - b);
  expect(apis, 'compatibility.leftBehindAndroidApis').toEqual([24, 25]);
});

test('a broken build 7 is answered going forward, with a higher versionCode', () => {
  expect(['forward-fix', 'kill-switch'].includes(note.ifBroken.action), `ifBroken.action is "${note.ifBroken.action}"`).toBe(true);
  expect(note.ifBroken.nextVersionCode, 'ifBroken.nextVersionCode').toBeGreaterThan(7);
});

test('what cannot be undone is listed', () => {
  for (const word of note.cannotUndo) {
    expect(UNDO_WORDS.includes(word), `"${word}" is one of UNDO_WORDS`).toBe(true);
  }
  expect([...note.cannotUndo].sort(), 'cannotUndo').toEqual(['installed-builds', 'migrated-data', 'used-version-code']);
});
