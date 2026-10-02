// assertInvariant(totals) returns nothing when the index is consistent and throws an Error
// with a clear message when it is not. The invariant of the index:
// 1. every record is stored under its own id;
// 2. the total of every category equals the sum of amountMinor of the records in that category,
//    and every category of the records has a total;
// 3. overall equals the sum of the category totals.
// It does not change the index.
export function assertInvariant(totals) {
  const fromRecords = new Map();
  for (const [id, expense] of totals.records) {
    if (expense.id !== id) {
      throw new Error(`%%wrongKey%% ${id} → ${expense.id}`);
    }
    fromRecords.set(expense.category, (fromRecords.get(expense.category) ?? 0) + expense.amountMinor);
  }
  for (const [category, sum] of fromRecords) {
    if (totals.byCategory.get(category) !== sum) {
      throw new Error(`%%wrongCategory%% ${category}: ${totals.byCategory.get(category)} ≠ ${sum}`);
    }
  }
  let overall = 0;
  for (const total of totals.byCategory.values()) {
    overall = overall + total;
  }
  if (overall !== totals.overall) {
    throw new Error(`%%wrongOverall%% ${totals.overall} ≠ ${overall}`);
  }
}
