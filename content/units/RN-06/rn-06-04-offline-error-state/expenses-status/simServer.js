// A SIMULATED mock service and network for the preview. `mode` is changed by the buttons on the screen.
export const sim = { mode: 'ok' }; // 'ok' | 'airplane' | 'server-500' | 'invalid'

const expenses = [
  { id: 'e-01', label: '%%groceries%%', amountMinor: 84550 },
  { id: 'e-02', label: '%%pass%%', amountMinor: 52000 },
  { id: 'e-03', label: '%%coffee%%', amountMinor: 18000 },
];

// Behaves like React Native's fetch for each mode.
export async function simulatedFetch() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (sim.mode === 'airplane') throw new TypeError('Network request failed');
  if (sim.mode === 'server-500') return new Response('{"error":"boom"}', { status: 500 });
  if (sim.mode === 'invalid') return new Response('{"records":"not-a-list"}', { status: 200 });
  return new Response(JSON.stringify(expenses), { status: 200 });
}
