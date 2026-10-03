// The list shows up, but the release build still sends a request to the developer's computer first.
import { simulatedFetch } from './simulated-network.js';
import bundledExpenses from './expenses.json';

const DEV_MACHINE = 'http://10.0.2.2:7310';

export async function loadExpenses() {
  try {
    const response = await simulatedFetch(`${DEV_MACHINE}/records/expenses`);
    return await response.json();
  } catch (error) {
    console.log('load failed:', error.name, error.message);
    return bundledExpenses;
  }
}
