// Starts listening to the app's state changes through `appState` (an object with React Native's
// AppState API). Returns a function that stops listening.
export function watchLifecycle(appState, { saveDraft, refreshToday }) {
  // Saves on 'inactive' — but Android never sends 'inactive'.
  const subscription = appState.addEventListener('change', (next) => {
    if (next === 'inactive') saveDraft();
    if (next === 'active') refreshToday();
  });
  return () => subscription.remove();
}
