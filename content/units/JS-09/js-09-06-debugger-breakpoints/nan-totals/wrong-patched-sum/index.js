const expenses = [
  { id: "e-01", label: "%%e01%%", amountMinor: 84550, date: "2026-03-01", category: "food" },
  { id: "e-02", label: "%%e02%%", amountMinor: 52000, date: "2026-03-01", category: "transport" },
  { id: "e-03", label: "%%e03%%", amountMinor: 18000, date: "2026-02-28", category: "fun" },
  { id: "e-04", label: "%%e04%%", amountMinor: 9990, date: "2026-02-27", category: "home" },
  { id: "e-05", label: "%%e05%%", amountMinor: 30000, date: "2026-02-27", category: "fun" },
  { id: "e-06", label: "%%e06%%", amountMinor: 21050, date: "2026-03-02", category: "food" },
];

// Totals in minor units for every category of the project: food, transport, home and fun.
// A category without expenses has the total 0.
function totalsByCategory(list) {
  const totals = { food: 0, transport: 0, fun: 0 };
  for (const expense of list) {
    totals[expense.category] = (totals[expense.category] ?? 0) + expense.amountMinor;
  }
  return totals;
}

console.log(totalsByCategory(expenses));
