// The release works, but the debug build lost the mock service it was developed against.
import bundledExpenses from './expenses.json';

export async function loadExpenses() {
  return bundledExpenses;
}
