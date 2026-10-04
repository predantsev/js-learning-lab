// An in-memory expenses repository with two kinds of lookups.
// In SQL they would be:
//   findById(id)               SELECT * FROM expenses WHERE id = ?
//   findOwned(id, ownerId)     SELECT * FROM expenses WHERE id = ? AND ownerId = ?
//   listOwned(ownerId)         SELECT * FROM expenses WHERE ownerId = ?
const seed = [
  { id: 'e-1', ownerId: 'u-01', title: '%%groceries%%', amountMinor: 45250 },
  { id: 'e-2', ownerId: 'u-01', title: '%%pharmacy%%', amountMinor: 18900 },
  { id: 'e-3', ownerId: 'u-02', title: '%%bus%%', amountMinor: 1600 },
];

export function createRepo() {
  const expenses = seed.map((expense) => ({ ...expense }));
  return {
    findById: (id) => expenses.find((e) => e.id === id),
    findOwned: (id, ownerId) => expenses.find((e) => e.id === id && e.ownerId === ownerId),
    listOwned: (ownerId) => expenses.filter((e) => e.ownerId === ownerId),
    update(expense, changes) {
      Object.assign(expense, changes, { id: expense.id, ownerId: expense.ownerId });
      return expense;
    },
    remove: (expense) => expenses.splice(expenses.indexOf(expense), 1),
  };
}
