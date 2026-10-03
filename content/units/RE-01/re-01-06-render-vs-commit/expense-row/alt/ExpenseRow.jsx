export function ExpenseRow({ expense }) {
  console.log(`render ExpenseRow ${expense.id}`);
  const amount = (expense.amountMinor / 100).toFixed(2);
  return (
    <tr data-id={expense.id}>
      <td>{expense.label}</td>
      <td>
        {amount} %%currency%%
      </td>
      <td>{expense.date}</td>
    </tr>
  );
}
