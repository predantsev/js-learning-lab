// Starts listening to the app's state changes through `appState` (an object with React Native's
// AppState API). Returns a function that stops listening.
export function watchLifecycle(appState, { saveDraft, refreshToday }) {
  // Saves on every state that is not 'active' — on iOS that is 'inactive' and then 'background': two saves.
  const subscription = appState.addEventListener('change', (next) => {
    if (next !== 'active') saveDraft();
    else refreshToday();
  });
  return () => subscription.remove();
}
