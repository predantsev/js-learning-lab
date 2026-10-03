// Starts listening to the app's state changes through `appState` (an object with React Native's
// AppState API). Returns a function that stops listening.
export function watchLifecycle(appState, { saveDraft, refreshToday }) {
  // TODO: save the draft when the app goes to the background; refresh today's values when it is active again
  return () => {};
}
