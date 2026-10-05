// A stand-in for a live price feed: components subscribe and get every price drop.
const listeners = new Set();

export const priceFeed = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  emit(drop) {
    for (const listener of listeners) listener(drop);
  },
  listenerCount: () => listeners.size,
};
