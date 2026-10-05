import { capabilityReducer, uiModeOf } from './capability.ts';

// A fresh start for every check: the demo in index.js may already have changed the exported initialCapabilityState.
const start = () => ({ hasCamera: null, permission: null, requesting: false });

const UNDETERMINED = { status: 'undetermined', canAskAgain: true };
const DENIED = { status: 'denied', canAskAgain: true };
const BLOCKED = { status: 'denied', canAskAgain: false };
const GRANTED = { status: 'granted', canAskAgain: true };

// Plays events from the initial state and returns the final state.
function play(...events) {
  return events.reduce((state, event) => capabilityReducer(state, event), start());
}
const camera = (hasCamera) => ({ type: 'capability-checked', hasCamera });
const read = (permission) => ({ type: 'permission-read', permission });
const finished = (permission) => ({ type: 'request-finished', permission });
const started = { type: 'request-started' };

const guard = () => {
  expect(typeof capabilityReducer, 'type of capabilityReducer').toBe('function');
  expect(typeof uiModeOf, 'type of uiModeOf').toBe('function');
};

test('nothing checked yet is checking', () => {
  guard();
  expect(uiModeOf(start()), 'the initial state').toBe('checking');
  expect(uiModeOf(play(camera(true))), 'camera checked, permission not read').toBe('checking');
});

test('a missing camera is the fallback, whatever the permission says', () => {
  guard();
  expect(uiModeOf(play(camera(false))), 'no camera, permission not read').toBe('fallback');
  expect(uiModeOf(play(camera(false), read(GRANTED))), 'no camera, permission granted').toBe('fallback');
  expect(uiModeOf(play(camera(false), read(BLOCKED))), 'no camera, permission blocked').toBe('fallback');
  expect(uiModeOf(play(camera(false), read(UNDETERMINED), started)), 'no camera, then request-started').toBe('fallback');
});

test('each permission answer maps to its own mode', () => {
  guard();
  expect(uiModeOf(play(camera(true), read(UNDETERMINED))), 'not asked yet').toBe('request');
  expect(uiModeOf(play(camera(true), read(GRANTED))), 'granted').toBe('ready');
  expect(uiModeOf(play(camera(true), read(DENIED))), 'denied, can ask again').toBe('rationale');
  expect(uiModeOf(play(camera(true), read(BLOCKED))), 'denied, cannot ask again').toBe('open-settings');
});

test('a request shows waiting, then the answer', () => {
  guard();
  expect(uiModeOf(play(camera(true), read(UNDETERMINED), started)), 'after request-started').toBe('waiting');
  expect(uiModeOf(play(camera(true), read(UNDETERMINED), started, finished(DENIED))), 'after the first deny').toBe('rationale');
  expect(uiModeOf(play(camera(true), read(DENIED), started, finished(BLOCKED))), 'after the second deny').toBe('open-settings');
  expect(uiModeOf(play(camera(true), read(UNDETERMINED), started, finished(GRANTED))), 'after allow').toBe('ready');
});

test('a request is ignored where the screen offers no request button', () => {
  guard();
  expect(uiModeOf(play(camera(true), read(BLOCKED), started)), 'request-started while blocked').toBe('open-settings');
  expect(uiModeOf(play(camera(true), read(GRANTED), started)), 'request-started while granted').toBe('ready');
  expect(uiModeOf(play(started)), 'request-started before anything was checked').toBe('checking');
  const once = play(camera(true), read(UNDETERMINED), started);
  const twice = capabilityReducer(once, started);
  expect(twice.requesting, 'requesting after a second request-started').toBe(true);
  expect(uiModeOf(capabilityReducer(twice, finished(DENIED))), 'one answer ends the request').toBe('rationale');
});

test('a fresh read replaces an earlier grant', () => {
  guard();
  expect(uiModeOf(play(camera(true), read(GRANTED), read(BLOCKED))), 'granted, then revoked in Settings').toBe('open-settings');
  expect(uiModeOf(play(camera(true), read(BLOCKED), read(GRANTED))), 'blocked, then allowed in Settings').toBe('ready');
  expect(uiModeOf(play(camera(true), read(UNDETERMINED), started, finished(GRANTED), read(DENIED))), 'granted by the dialog, then revoked').toBe('rationale');
});

test('the reducer returns new states and never changes the old one', () => {
  guard();
  const before = play(camera(true), read(UNDETERMINED));
  const copy = JSON.parse(JSON.stringify(before));
  const after = capabilityReducer(before, started);
  capabilityReducer(before, read(GRANTED));
  capabilityReducer(before, finished(DENIED));
  expect(before, 'the state passed to the reducer').toEqual(copy);
  expect(after === before, 'request-started returned the same object it received').toBe(false);
});
