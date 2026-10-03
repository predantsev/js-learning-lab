export const INITIAL_EXPENSES = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550 },
  { id: "e-02", label: "%%transit%%", amountMinor: 52000 },
  { id: "e-04", label: "%%bulbs%%", amountMinor: 9990 },
];

export function formatAmount(amountMinor) {
  return (amountMinor / 100).toFixed(2);
}

export function parseAmount(text) {
  return Math.round(Number(text.replace(",", ".")) * 100);
}
