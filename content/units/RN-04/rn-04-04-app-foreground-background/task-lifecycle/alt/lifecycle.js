// Starts listening to the app's state changes through `appState` (an object with React Native's
// AppState API). Returns a function that stops listening.
export function watchLifecycle(appState, { saveDraft, refreshToday }) {
  function onChange(next) {
    switch (next) {
      case 'background':
        saveDraft();
        break;
      case 'active':
        refreshToday();
        break;
      default:
      // 'inactive' (iOS only) is a short transition: nothing to do yet
    }
  }
  const subscription = appState.addEventListener('change', onChange);
  return function stop() {
    subscription.remove();
  };
}
