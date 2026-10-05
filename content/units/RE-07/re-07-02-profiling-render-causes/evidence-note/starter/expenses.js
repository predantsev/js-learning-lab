// 2,000 synthetic expenses built from six base records. Amounts are in kopiykas (minor units).
const BASE = [
  { label: "%%groceries%%", amountMinor: 84550, category: "food" },
  { label: "%%transit%%", amountMinor: 52000, category: "transport" },
  { label: "%%coffee%%", amountMinor: 18000, category: "fun" },
  { label: "%%bulbs%%", amountMinor: 9990, category: "home" },
  { label: "%%cinema%%", amountMinor: 30000, category: "fun" },
  { label: "%%lunch%%", amountMinor: 21050, category: "food" },
];

export const CATEGORIES = ["food", "transport", "home", "fun"];

export const EXPENSES = Array.from({ length: 2000 }, (_, index) => {
  const base = BASE[index % BASE.length];
  return { id: `e-${index + 1}`, label: base.label, amountMinor: base.amountMinor + (index % 9) * 100, category: base.category };
});
