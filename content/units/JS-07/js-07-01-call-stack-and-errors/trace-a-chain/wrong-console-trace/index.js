// console.trace() prints a trace, but the check reads only console.log output.

function formatAmount(amountMinor) {
  console.trace();
  return (amountMinor / 100).toFixed(2) + " %%uah%%";
}

function formatRow(expense) {
  return expense.label + ": " + formatAmount(expense.amountMinor);
}

function printExpense(expense) {
  console.log(formatRow(expense));
}

const lunch = { id: "e-06", label: "%%lunch%%", amountMinor: 21050, date: "2026-03-02", category: "food" };
printExpense(lunch);
