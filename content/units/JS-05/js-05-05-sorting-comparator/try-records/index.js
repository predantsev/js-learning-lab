const expenses = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550, date: "2026-03-01" },
  { id: "e-02", label: "%%transit%%", amountMinor: 52000, date: "2026-03-01" },
  { id: "e-03", label: "%%coffee%%", amountMinor: 18000, date: "2026-02-28" },
  { id: "e-04", label: "%%bulbs%%", amountMinor: 9990, date: "2026-02-27" },
  { id: "e-05", label: "%%cinema%%", amountMinor: 30000, date: "2026-02-27" },
];

const byAmount = (a, b) => a.amountMinor - b.amountMinor;
const byDate = (a, b) => a.date.localeCompare(b.date);

const cheapFirst = expenses.toSorted(byAmount);
console.log(cheapFirst.map((expense) => expense.label));

const byDay = expenses.toSorted(byDate);
console.log(byDay.map((expense) => expense.id));

console.log(expenses.map((expense) => expense.id));
