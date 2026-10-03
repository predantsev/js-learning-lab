// A query cache. A key is an array of parts, such as ["tasks", "pending"] or ["settings"].
// An entry is { data, stale }: stale data may still be shown, but it must be fetched again.
export function createQueryCache() {
  const entries = new Map();
  const listeners = new Set();

  function notify() {
    for (const listener of listeners) listener();
  }

  return {
    // Returns the entry stored under an equal key ({ data, stale }), or undefined.
    get(key) {
      // TODO
      return undefined;
    },
    // Stores fresh data under the key and notifies the subscribers.
    set(key, data) {
      // TODO
    },
    // Marks as stale every entry whose key starts with all the parts of `prefix`
    // (["tasks"] matches ["tasks", "done"], but not ["settings"]) and notifies the subscribers.
    invalidate(prefix) {
      // TODO
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
