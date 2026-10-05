// Misconception: "the address is wrong, localhost will do" — a release build still has no dev machine.
import { simulatedFetch } from './simulated-network.js';

const DEV_MACHINE = 'http://localhost:7310';

export async function loadExpenses() {
  try {
    const response = await simulatedFetch(`${DEV_MACHINE}/records/expenses`);
    return await response.json();
  } catch (error) {
    console.log('load failed:', error.name, error.message);
    return [];
  }
}
