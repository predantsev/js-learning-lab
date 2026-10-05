// The expenses of the project and its categories. Read-only.
export const CATEGORIES = [
  { id: "food", name: "%%food%%" },
  { id: "transport", name: "%%transport%%" },
  { id: "home", name: "%%home%%" },
  { id: "fun", name: "%%fun%%" },
];

export const expenses = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550, date: "2026-03-01", category: "food" },
  { id: "e-02", label: "%%transitPass%%", amountMinor: 52000, date: "2026-03-01", category: "transport" },
  { id: "e-03", label: "%%coffee%%", amountMinor: 18000, date: "2026-02-28", category: "fun" },
  { id: "e-04", label: "%%bulbs%%", amountMinor: 9990, date: "2026-02-27", category: "home" },
  { id: "e-05", label: "%%cinema%%", amountMinor: 30000, date: "2026-02-27", category: "fun" },
  { id: "e-06", label: "%%lunch%%", amountMinor: 21050, date: "2026-03-02", category: "food" },
];

// Minor units (kopiykas) as text with two decimals, only for display: 21050 → "210.50".
export function formatAmount(amountMinor) {
  return (amountMinor / 100).toFixed(2);
}
