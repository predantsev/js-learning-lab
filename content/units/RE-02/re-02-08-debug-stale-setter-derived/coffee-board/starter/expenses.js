// Expenses of the week and helpers. Read-only.
export const CATEGORIES = [
  { id: "food", name: "%%food%%" },
  { id: "fun", name: "%%fun%%" },
];

export const expenses = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550, date: "2026-03-01", category: "food" },
  { id: "e-03", label: "%%coffeeFriends%%", amountMinor: 18000, date: "2026-02-28", category: "fun" },
  { id: "e-06", label: "%%lunch%%", amountMinor: 21050, date: "2026-03-02", category: "food" },
];

let nextNumber = 7;

// A new coffee expense with a fresh id ("e-07", "e-08", …): 45.00 UAH, category "fun".
export function createCoffee() {
  const id = "e-" + String(nextNumber).padStart(2, "0");
  nextNumber += 1;
  return { id, label: "%%coffee%%", amountMinor: 4500, date: "2026-03-02", category: "fun" };
}

// Minor units as text with two decimals, only for display: 4500 → "45.00".
export function formatAmount(amountMinor) {
  return (amountMinor / 100).toFixed(2);
}
