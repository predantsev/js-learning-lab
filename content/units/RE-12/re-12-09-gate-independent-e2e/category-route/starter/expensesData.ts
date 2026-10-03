export type CategoryId = "food" | "transport" | "home" | "fun";

export type Category = { id: CategoryId; name: string };

export type Expense = {
  id: string;
  label: string;
  amountMinor: number; // kopiykas: 84550 is 845.50
  date: string; // YYYY-MM-DD
  category: CategoryId;
};

export const categories: Category[] = [
  { id: "food", name: "%%food%%" },
  { id: "transport", name: "%%transport%%" },
  { id: "home", name: "%%home%%" },
  { id: "fun", name: "%%fun%%" },
];

export const expenses: Expense[] = [
  { id: "e-01", label: "%%e1%%", amountMinor: 84550, date: "2026-03-01", category: "food" },
  { id: "e-02", label: "%%e2%%", amountMinor: 52000, date: "2026-03-01", category: "transport" },
  { id: "e-03", label: "%%e3%%", amountMinor: 18000, date: "2026-02-28", category: "fun" },
  { id: "e-04", label: "%%e4%%", amountMinor: 9990, date: "2026-02-27", category: "home" },
  { id: "e-05", label: "%%e5%%", amountMinor: 30000, date: "2026-02-27", category: "fun" },
  { id: "e-06", label: "%%e6%%", amountMinor: 21050, date: "2026-03-02", category: "food" },
];

export function formatMinor(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2);
}
