import { AppState, appStateListenerCount, leaveApp, returnToApp, simulateAppState } from './appStateSim.jsx';
import { watchLifecycle } from './lifecycle.js';

// Each check starts with the app active and its own listener, and stops it at the end.
function start() {
  simulateAppState('active');
  const saveDraft = spy();
  const refreshToday = spy();
  const stop = watchLifecycle(AppState, { saveDraft, refreshToday });
  return { saveDraft, refreshToday, stop: typeof stop === 'function' ? stop : () => {} };
}

test('Android: leaving the app saves the draft', () => {
  const { saveDraft, stop } = start();
  leaveApp('android');
  stop();
  expect(saveDraft, 'saveDraft after leaving on Android').toHaveBeenCalledTimes(1);
});

test('iOS: leaving the app saves the draft once', () => {
  const { saveDraft, stop } = start();
  leaveApp('ios');
  stop();
  expect(saveDraft, 'saveDraft after inactive → background on iOS').toHaveBeenCalledTimes(1);
});

test('coming back refreshes today, leaving does not', () => {
  const { refreshToday, stop } = start();
  leaveApp('ios');
  expect(refreshToday, 'refreshToday while leaving').toHaveBeenCalledTimes(0);
  returnToApp();
  stop();
  expect(refreshToday, 'refreshToday after coming back').toHaveBeenCalledTimes(1);
});

test('the returned function stops listening', () => {
  simulateAppState('active');
  const before = appStateListenerCount();
  const { saveDraft, refreshToday, stop } = start();
  stop();
  leaveApp('android');
  returnToApp();
  expect(saveDraft.calls.length + refreshToday.calls.length, 'calls after the returned function ran').toBe(0);
  expect(appStateListenerCount(), 'subscribed listeners after the returned function ran').toBe(before);
});
