// A pretend connection to the expense server. Components subscribe to hear about changes.
const listeners = new Set();

export const connection = {
  online: true,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setOnline(online) {
    connection.online = online;
    listeners.forEach((listener) => listener(online));
  },
  listenerCount: () => listeners.size,
};
