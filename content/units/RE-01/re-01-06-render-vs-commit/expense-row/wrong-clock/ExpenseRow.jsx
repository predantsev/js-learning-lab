// A hidden "rendered at" stamp: it differs on every render, so every row is committed again.
export function ExpenseRow({ expense }) {
  console.log(`render ExpenseRow ${expense.id}`);
  return (
    <tr data-id={expense.id}>
      <td>{expense.label}</td>
      <td>{`${(expense.amountMinor / 100).toFixed(2)} %%currency%%`}</td>
      <td>
        {expense.date}
        <span hidden>{performance.now()}</span>
      </td>
    </tr>
  );
}
