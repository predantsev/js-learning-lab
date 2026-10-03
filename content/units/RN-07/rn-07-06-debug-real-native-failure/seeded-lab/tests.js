import { build, prebuild, openCapture } from './nativeSim.js';
import { dependencies } from './deps.js';
import { appJson } from './appJson.js';
import { notes } from './notes.js';

test('the simulated build finishes', () => {
  expect(build(dependencies).ok, 'the build with deps.js finishes').toBe(true);
});

test('the capture screen opens on iOS without a crash', () => {
  expect(openCapture('ios', prebuild(appJson)).crashed, 'the iOS capture screen crashed').toBe(false);
});

test('the capture screen can ask for the camera on Android', () => {
  expect(Boolean(openCapture('android', prebuild(appJson)).denied), 'Android answers "denied" without a dialog').toBe(false);
});

test('the notes quote the first decisive line of each failure', () => {
  expect(String(notes?.buildFailure ?? ''), 'notes.buildFailure').toContain('expo-camera@58');
  expect(String(notes?.captureCrash ?? ''), 'notes.captureCrash').toContain('missing NSCameraUsageDescription');
});
