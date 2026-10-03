// Starts listening to the app's state changes through `appState` (an object with React Native's
// AppState API). Returns a function that stops listening.
export function watchLifecycle(appState, { saveDraft, refreshToday }) {
  // Refreshes on every change, not only on the way back.
  const subscription = appState.addEventListener('change', (next) => {
    if (next === 'background') saveDraft();
    refreshToday();
  });
  return () => subscription.remove();
}
