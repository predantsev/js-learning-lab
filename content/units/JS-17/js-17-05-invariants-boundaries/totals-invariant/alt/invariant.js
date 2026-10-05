// Another valid approach: compute what the totals should be from the records, then compare.
export function assertInvariant(totals) {
  const records = [...totals.records];
  const misplaced = records.find(([id, expense]) => id !== expense.id);
  if (misplaced) {
    throw new Error(`%%wrongKey%% ${misplaced[0]}`);
  }
  const expected = {};
  for (const [, expense] of records) {
    expected[expense.category] = (expected[expense.category] ?? 0) + expense.amountMinor;
  }
  for (const category of Object.keys(expected)) {
    if (totals.byCategory.get(category) !== expected[category]) {
      throw new Error(`%%wrongCategory%% ${category}`);
    }
  }
  for (const [category, total] of totals.byCategory) {
    if (total !== (expected[category] ?? 0)) {
      throw new Error(`%%wrongCategory%% ${category}`);
    }
  }
  const sum = [...totals.byCategory.values()].reduce((total, value) => total + value, 0);
  if (sum !== totals.overall) {
    throw new Error(`%%wrongOverall%% ${totals.overall}`);
  }
}
