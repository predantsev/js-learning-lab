// Return <tr data-id={expense.id}> with three <td>: the label, the amount as "180.00 UAH"
// (amountMinor is in kopiykas) and the date. Keep the render log line.
export function ExpenseRow({ expense }) {
  console.log(`render ExpenseRow ${expense.id}`);
  return (
    <tr data-id={expense.id}>
      <td>{expense.label}</td>
      <td>{`${(expense.amountMinor / 100).toFixed(2)} %%currency%%`}</td>
      <td>{expense.date}</td>
    </tr>
  );
}
