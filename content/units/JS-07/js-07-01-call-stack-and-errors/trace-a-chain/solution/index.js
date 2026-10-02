// Three functions that call each other: printExpense → formatRow → formatAmount.

function formatAmount(amountMinor) {
  // Return the amount in hryvnias with two digits after the point: 21050 → "210.50 UAH".
  // Before returning, print the stack trace of this moment to the console.
  console.log(new Error("formatAmount was called").stack);
  return (amountMinor / 100).toFixed(2) + " %%uah%%";
}

function formatRow(expense) {
  // Return the label, a colon and the amount from formatAmount: "Lunch: 210.50 UAH".
  return expense.label + ": " + formatAmount(expense.amountMinor);
}

function printExpense(expense) {
  // Print the row from formatRow to the console.
  console.log(formatRow(expense));
}

const lunch = { id: "e-06", label: "%%lunch%%", amountMinor: 21050, date: "2026-03-02", category: "food" };
printExpense(lunch);
