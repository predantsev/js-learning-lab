// The error object itself is printed, not its stack: the console shows only its first line.

function formatAmount(amountMinor) {
  console.log(new Error("formatAmount was called"));
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
