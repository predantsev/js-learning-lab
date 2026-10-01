const expenses = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550, category: "food" },
  { id: "e-02", label: "%%transit%%", amountMinor: 52000, category: "transport" },
  { id: "e-03", label: "%%coffee%%", amountMinor: 18000, category: "fun" },
  { id: "e-04", label: "%%bulbs%%", amountMinor: 9990, category: "home" },
  { id: "e-05", label: "%%cinema%%", amountMinor: 30000, category: "fun" },
  { id: "e-06", label: "%%lunch%%", amountMinor: 21050, category: "food" },
];

// The accumulator is an object: one counter per category.
const counts = expenses.reduce((acc, expense) => {
  acc[expense.category] = (acc[expense.category] ?? 0) + 1;
  console.log(acc);
  return acc;
}, {});

console.log(counts);
console.log(expenses[0]);
