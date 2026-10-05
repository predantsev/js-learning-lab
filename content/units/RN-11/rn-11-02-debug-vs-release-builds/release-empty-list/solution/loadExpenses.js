import { simulatedFetch } from './simulated-network.js';
import bundledExpenses from './expenses.json';

// The mock service on the developer's computer, as the Android emulator sees it.
// Only a debug build talks to it; a release build has no dev machine to talk to.
const DEV_MACHINE = 'http://10.0.2.2:7310';

export async function loadExpenses() {
  if (!__DEV__) return bundledExpenses;
  try {
    const response = await simulatedFetch(`${DEV_MACHINE}/records/expenses`);
    return await response.json();
  } catch (error) {
    console.log('load failed:', error.name, error.message);
    return bundledExpenses;
  }
}
