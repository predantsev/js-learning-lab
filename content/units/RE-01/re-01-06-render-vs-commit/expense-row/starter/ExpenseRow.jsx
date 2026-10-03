// Return <tr data-id={expense.id}> with three <td>: the label, the amount as "180.00 UAH"
// (amountMinor is in kopiykas) and the date. Keep the render log line.
export function ExpenseRow({ expense }) {
  console.log(`render ExpenseRow ${expense.id}`);
  return null;
}
