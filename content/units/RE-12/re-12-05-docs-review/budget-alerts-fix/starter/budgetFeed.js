// A stand-in for the app's live budget feed: subscribe() returns a function that unsubscribes.
const listeners = new Set();

export const budgetFeed = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  emit(alert) {
    for (const listener of listeners) listener(alert);
  },
  listenerCount: () => listeners.size,
};
