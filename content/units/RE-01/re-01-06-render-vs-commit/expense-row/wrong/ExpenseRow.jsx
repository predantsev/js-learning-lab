// The amount is shown in kopiykas, not formatted.
export function ExpenseRow({ expense }) {
  console.log(`render ExpenseRow ${expense.id}`);
  return (
    <tr data-id={expense.id}>
      <td>{expense.label}</td>
      <td>{expense.amountMinor}</td>
      <td>{expense.date}</td>
    </tr>
  );
}
