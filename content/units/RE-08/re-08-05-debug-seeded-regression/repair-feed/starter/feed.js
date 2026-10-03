// A fake live feed of habit completions: an outside system that calls every subscriber with each
// new completion. subscribe() returns a function that ends that subscription.
const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publish(record) {
  for (const listener of [...listeners]) listener(record);
}

export function subscriberCount() {
  return listeners.size;
}
