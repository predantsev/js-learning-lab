// Two versions of the same records: in the second one the coffee costs more.
export const before = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550, date: "2026-03-01" },
  { id: "e-02", label: "%%pass%%", amountMinor: 52000, date: "2026-03-01" },
  { id: "e-03", label: "%%coffee%%", amountMinor: 18000, date: "2026-02-28" },
  { id: "e-04", label: "%%bulbs%%", amountMinor: 9990, date: "2026-02-27" },
];
export const after = before.map((expense) => (expense.id === "e-03" ? { ...expense, amountMinor: 18550 } : expense));
