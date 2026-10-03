import { simulatedFetch } from './simulated-network.js';
import bundledExpenses from './expenses.json';

const DEV_MACHINE = 'http://10.0.2.2:7310';

async function fromMockService() {
  const response = await simulatedFetch(`${DEV_MACHINE}/records/expenses`);
  return response.json();
}

// Debug: the mock service. Release: the expenses embedded in the app.
export function loadExpenses() {
  return __DEV__ ? fromMockService() : Promise.resolve(bundledExpenses);
}
