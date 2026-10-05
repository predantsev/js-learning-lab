// 20,000 synthetic expenses over two years. Amounts are in kopiykas (minor units).
const LABELS = ["%%groceries%%", "%%transit%%", "%%coffee%%", "%%bulbs%%", "%%cinema%%", "%%lunch%%"];

export const EXPENSES = Array.from({ length: 20000 }, (_, index) => {
  const month = String((index % 24) % 12 + 1).padStart(2, "0");
  const year = index % 24 < 12 ? 2025 : 2026;
  const day = String((index % 28) + 1).padStart(2, "0");
  return { id: `e-${index + 1}`, label: LABELS[index % LABELS.length], amountMinor: 5000 + (index % 97) * 150, date: `${year}-${month}-${day}` };
});

// Totals per month, newest month first. Sorting 20,000 records is the expensive part.
export function monthlyTotals(expenses) {
  const sorted = expenses.toSorted((a, b) => new Date(b.date) - new Date(a.date));
  const totals = new Map();
  for (const expense of sorted) {
    const month = expense.date.slice(0, 7);
    totals.set(month, (totals.get(month) ?? 0) + expense.amountMinor);
  }
  return [...totals].map(([month, sum]) => ({ month, sum }));
}
