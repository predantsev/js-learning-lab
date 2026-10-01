// Three functions that call each other: printExpense → formatRow → formatAmount.

function formatAmount(amountMinor) {
  const hryvnias = amountMinor / 100;
  const checkpoint = new Error();
  console.info(checkpoint.stack);
  return hryvnias.toFixed(2) + " %%uah%%";
}

function formatRow(expense) {
  const amount = formatAmount(expense.amountMinor);
  return expense.label + ": " + amount;
}

function printExpense(expense) {
  const row = formatRow(expense);
  console.log(row);
}

const lunch = { id: "e-06", label: "%%lunch%%", amountMinor: 21050, date: "2026-03-02", category: "food" };
printExpense(lunch);
