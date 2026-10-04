// sim.js (read-only): SIMULATED phone parts for the preview.
//
// createAppState() has the API shape of React Native's AppState: currentState and
// addEventListener('change', handler) returning a subscription with remove(). leave() sends
// 'background' (Android's order; iOS sends 'inactive' first) and comeBack() sends 'active'.
// Where it differs from React Native: only the 'change' event exists, the state changes only
// when leave()/comeBack() are called (React Native's own AppState in the browser follows the tab's
// visibility), and an error thrown by a handler reaches the caller of comeBack() instead of
// React Native's global error handler (in a release build that handler closes the app).
//
// createDeviceClock(day) stands for the phone's clock: day-clock reads it. setDay() moves the
// calendar, as if midnight passed while the app was in the background.
export function createAppState() {
  const handlers = new Set();
  let current = 'active';
  const send = (next) => {
    current = next;
    for (const entry of [...handlers]) entry.handler(next);
  };
  return {
    get currentState() {
      return current;
    },
    addEventListener(type, handler) {
      if (type !== 'change') throw new Error(`This simulation only has the 'change' event, not '${type}'`);
      const entry = { handler };
      handlers.add(entry);
      return { remove: () => handlers.delete(entry) };
    },
    leave: () => send('background'),
    comeBack: () => send('active'),
    listenerCount: () => handlers.size,
  };
}

export function createDeviceClock(day) {
  let current = day;
  return {
    read: () => current,
    setDay: (next) => {
      current = next;
    },
  };
}
