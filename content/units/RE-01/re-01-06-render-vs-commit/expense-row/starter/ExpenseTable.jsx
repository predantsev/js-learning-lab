import { ExpenseRow } from "./ExpenseRow";

export function ExpenseTable({ expenses }) {
  return (
    <table>
      <thead>
        <tr>
          <th scope="col">%%colLabel%%</th>
          <th scope="col">%%colAmount%%</th>
          <th scope="col">%%colDate%%</th>
        </tr>
      </thead>
      <tbody>
        {expenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} />)}
      </tbody>
    </table>
  );
}
