// The stack is printed in the outermost function, so formatRow and formatAmount are not in it.
// The amount also misses its second digit after the point.

function formatAmount(amountMinor) {
  return amountMinor / 100 + " %%uah%%";
}

function formatRow(expense) {
  return expense.label + ": " + formatAmount(expense.amountMinor);
}

function printExpense(expense) {
  console.log(new Error("printExpense was called").stack);
  console.log(formatRow(expense));
}

const lunch = { id: "e-06", label: "%%lunch%%", amountMinor: 21050, date: "2026-03-02", category: "food" };
printExpense(lunch);
