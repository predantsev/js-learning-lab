// SIMULATION for the preview only (read-only). It stands in for fetch() in an app on the Android emulator:
// - the computer is reached at 10.0.2.2, and the mock service from RN-06 listens there on port 7310;
// - plain HTTP is allowed only in the debug variant: Expo's debug AndroidManifest.xml sets
//   android:usesCleartextTraffic="true", the main (release) manifest does not.
// A refused request rejects with TypeError, as fetch does in React Native.
// `calls` records every address the app asked for, so the checks can see it.
const MOCK_SERVICE = 'http://10.0.2.2:7310';

const mockExpenses = [
  { id: 'e-01', label: '%%groceries%%', amountMinor: 84550, date: '2026-03-01', category: 'food' },
  { id: 'e-02', label: '%%transit%%', amountMinor: 52000, date: '2026-03-01', category: 'transport' },
];

export const calls = [];

export async function simulatedFetch(url) {
  calls.push(url);
  await Promise.resolve();
  if (url.startsWith('http://') && !__DEV__) throw new TypeError('Network request failed');
  if (url === `${MOCK_SERVICE}/records/expenses`) {
    return { ok: true, status: 200, json: async () => mockExpenses.map((expense) => ({ ...expense })) };
  }
  throw new TypeError('Network request failed');
}
