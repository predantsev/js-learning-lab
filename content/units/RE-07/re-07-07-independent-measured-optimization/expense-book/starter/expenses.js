// 30,000 synthetic expenses over two years. Amounts are in kopiykas (minor units).
const BASE = [
  { label: "%%groceries%%", category: "food" },
  { label: "%%transit%%", category: "transport" },
  { label: "%%coffee%%", category: "fun" },
  { label: "%%bulbs%%", category: "home" },
  { label: "%%cinema%%", category: "fun" },
  { label: "%%lunch%%", category: "food" },
];

export const CATEGORIES = ["food", "transport", "home", "fun"];

export const EXPENSES = Array.from({ length: 30000 }, (_, index) => {
  const base = BASE[index % BASE.length];
  const month = String((index % 12) + 1).padStart(2, "0");
  const day = String((index % 28) + 1).padStart(2, "0");
  return {
    id: `e-${index + 1}`,
    label: `${base.label} ${index + 1}`,
    amountMinor: 1000 + (index % 89) * 250,
    date: `${index % 24 < 12 ? 2025 : 2026}-${month}-${day}`,
    category: base.category,
  };
});

let calls = 0;

// Totals per category and overall, plus the latest date. Counts its calls for the checks.
export function summarizeExpenses(expenses) {
  calls += 1;
  const byDate = expenses.toSorted((a, b) => new Date(b.date) - new Date(a.date));
  const totals = Object.fromEntries(CATEGORIES.map((category) => [category, 0]));
  let overall = 0;
  for (const expense of byDate) {
    totals[expense.category] += expense.amountMinor;
    overall += expense.amountMinor;
  }
  return { count: expenses.length, overall, totals, latest: byDate[0]?.date ?? null };
}

export function summarizeCalls() {
  return calls;
}
