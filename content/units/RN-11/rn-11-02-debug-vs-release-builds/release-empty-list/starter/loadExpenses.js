import { simulatedFetch } from './simulated-network.js';

// The mock service on the developer's computer, as the Android emulator sees it.
const DEV_MACHINE = 'http://10.0.2.2:7310';

export async function loadExpenses() {
  try {
    const response = await simulatedFetch(`${DEV_MACHINE}/records/expenses`);
    return await response.json();
  } catch (error) {
    console.log('load failed:', error.name, error.message);
    return [];
  }
}
