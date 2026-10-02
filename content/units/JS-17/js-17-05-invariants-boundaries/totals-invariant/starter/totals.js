// A category-totals index of the expense tracker, amounts in minor units:
// { records: Map(id → expense), byCategory: Map(category → total), overall }.
// Read-only: your invariant and your tests check this code.

// Builds the index from a list of expenses. An id that repeats is refused with an Error.
export function buildTotals(expenses) {
  const records = new Map();
  const byCategory = new Map();
  let overall = 0;
  for (const expense of expenses) {
    if (records.has(expense.id)) {
      throw new Error(`%%duplicateId%% ${expense.id}`);
    }
    records.set(expense.id, expense);
    byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + expense.amountMinor);
    overall = overall + expense.amountMinor;
  }
  return { records, byCategory, overall };
}

// A new index with one more expense. An id that is already there is refused with an Error;
// the index passed in is never changed.
export function addExpense(totals, expense) {
  if (totals.records.has(expense.id)) {
    throw new Error(`%%duplicateId%% ${expense.id}`);
  }
  const records = new Map(totals.records).set(expense.id, expense);
  const byCategory = new Map(totals.byCategory);
  byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + expense.amountMinor);
  return { records, byCategory, overall: totals.overall + expense.amountMinor };
}
