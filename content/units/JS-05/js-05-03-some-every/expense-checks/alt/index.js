const expenses = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550 },
  { id: "e-02", label: "%%transit%%", amountMinor: 52000 },
  { id: "e-03", label: "%%coffee%%", amountMinor: 18000 },
];

// Another valid approach: "no expense is unlabeled" with some, and a loop that returns early.
function allLabeled(list) {
  return !list.some((expense) => expense.label === "");
}

function anyOverLimit(list, limitMinor) {
  for (const expense of list) {
    if (expense.amountMinor > limitMinor) {
      return true;
    }
  }
  return false;
}

console.log(allLabeled(expenses));
console.log(anyOverLimit(expenses, 60000));
console.log(allLabeled([]), anyOverLimit([], 60000));
