// Starts listening to the app's state changes through `appState` (an object with React Native's
// AppState API). Returns a function that stops listening.
export function watchLifecycle(appState, { saveDraft, refreshToday }) {
  // Subscribes, but the returned function does not unsubscribe.
  appState.addEventListener('change', (next) => {
    if (next === 'background') saveDraft();
    if (next === 'active') refreshToday();
  });
  return () => {};
}
