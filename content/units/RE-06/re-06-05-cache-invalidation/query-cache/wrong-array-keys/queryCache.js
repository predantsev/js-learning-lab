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
      return entries.get(key);
    },
    // Stores fresh data under the key and notifies the subscribers.
    set(key, data) {
      entries.set(key, { key, data, stale: false });
      notify();
    },
    // Marks as stale every entry whose key starts with all the parts of `prefix`
    // (["tasks"] matches ["tasks", "done"], but not ["settings"]) and notifies the subscribers.
    invalidate(prefix) {
      for (const [text, entry] of entries) {
        if (prefix.every((part, index) => entry.key[index] === part)) {
          entries.set(text, { ...entry, stale: true });
        }
      }
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
