// Read-only stand-in for a slow expense repository. total(signal) answers after `delayMs`,
// or rejects with the signal's reason as soon as `signal` is aborted. It remembers the last signal.
export function createRepository({ delayMs }) {
  return {
    lastSignal: null,
    total(signal) {
      this.lastSignal = signal;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve(84550 + 52000 + 18000), delayMs);
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(signal.reason);
        }, { once: true });
      });
    },
  };
}
