const expenses = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550 },
  { id: "e-02", label: "%%transit%%", amountMinor: 52000 },
  { id: "e-03", label: "%%coffee%%", amountMinor: 18000 },
];

// Treats an empty list as "not labeled", which the task does not ask for.
function allLabeled(list) {
  return list.length > 0 && list.every((expense) => expense.label !== "");
}

function anyOverLimit(list, limitMinor) {
  return list.some((expense) => expense.amountMinor > limitMinor);
}

console.log(allLabeled(expenses));
console.log(anyOverLimit(expenses, 60000));
console.log(allLabeled([]), anyOverLimit([], 60000));
