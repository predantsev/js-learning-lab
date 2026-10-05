// A tiny expense store: updates are applied in memory after a slow step (as if a check of the
// category list took a while) and reach expenses.json only on flush().
import { writeFile } from 'node:fs/promises';

export function createStore(expenses) {
  let dirty = false;
  return {
    list: () => expenses,
    async update(id, changes) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const expense = expenses.find((e) => e.id === id);
      Object.assign(expense, changes);
      dirty = true;
      return expense;
    },
    async flush() {
      if (dirty) await writeFile('expenses.json', JSON.stringify(expenses));
      dirty = false;
    },
  };
}
