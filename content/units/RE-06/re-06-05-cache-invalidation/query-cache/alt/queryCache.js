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
      const found = entries.get(key.join("\u0000"));
      return found === undefined ? undefined : { data: found.data, stale: found.stale };
    },
    // Stores fresh data under the key and notifies the subscribers.
    set(key, data) {
      // The parts joined by a character no key part contains: equal keys give the same text.
      entries.set(key.join("\u0000"), { data, stale: false });
      notify();
    },
    // Marks as stale every entry whose key starts with all the parts of `prefix`
    // (["tasks"] matches ["tasks", "done"], but not ["settings"]) and notifies the subscribers.
    invalidate(prefix) {
      for (const [text, entry] of entries) {
        const parts = text.split("\u0000");
        const matches = prefix.length <= parts.length && prefix.every((part, index) => parts[index] === String(part));
        if (matches) entry.stale = true;
      }
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
