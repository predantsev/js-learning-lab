// A SIMULATED camera and permission service for the preview. Its answers have the shape of Expo's
// permission responses: { status: 'granted' | 'denied' | 'undetermined', canAskAgain: boolean }.
export const sim = {
  available: true, // does the device have a camera at all?
  status: 'undetermined',
  canAskAgain: true,
  nextAnswer: 'granted', // what the user taps in the system dialog: 'granted', 'denied' or 'denied-forever'
  requests: 0, // how many times the app asked
};

export function resetSim() {
  Object.assign(sim, { available: true, status: 'undetermined', canAskAgain: true, nextAnswer: 'granted' });
}

const answer = () => ({ status: sim.status, canAskAgain: sim.canAskAgain });

export const cameraAdapter = {
  async isAvailable() {
    return sim.available;
  },
  async getPermission() {
    return answer();
  },
  // Shows the system dialog only while the system still allows asking.
  async requestPermission() {
    sim.requests += 1;
    if (sim.status !== 'granted' && sim.canAskAgain) {
      sim.status = sim.nextAnswer === 'granted' ? 'granted' : 'denied';
      sim.canAskAgain = sim.nextAnswer !== 'denied-forever';
    }
    return answer();
  },
};

// Stands in for AppState.addEventListener('change', …) reporting 'active': returns an unsubscribe function.
const listeners = new Set();
export function onForeground(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function returnToForeground() {
  for (const listener of [...listeners]) listener();
}
