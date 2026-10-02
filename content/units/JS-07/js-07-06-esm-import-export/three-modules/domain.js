console.log("▶ domain.js");

// total(expenses): the sum of amountMinor over all expenses.
export function total(expenses) {
  let sum = 0;
  for (const expense of expenses) {
    sum = sum + expense.amountMinor;
  }
  return sum;
}
